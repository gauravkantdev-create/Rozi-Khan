from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from decimal import Decimal

from app.models.product import Product, ProductImage, ProductReview
from app.schemas.product import ProductCreateRequest, ReviewCreateRequest
from app.utils.helpers import generate_object_id

def create_product_service(req_data: ProductCreateRequest, user_id: str, db: Session):
    if not req_data.name or not req_data.description or req_data.price is None or not req_data.category:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide all required fields"
        )
        
    product_id = generate_object_id()
    
    product = Product(
        id=product_id,
        name=req_data.name,
        description=req_data.description,
        price=Decimal(str(req_data.price)),
        category=req_data.category,
        stock=req_data.stock,
        supplier=req_data.supplier,
        created_by=user_id
    )
    
    db.add(product)
    
    # Handle images
    if req_data.images:
        for img_url in req_data.images:
            product_image = ProductImage(
                id=generate_object_id(),
                product_id=product_id,
                image_url=img_url
            )
            db.add(product_image)
            
    db.commit()
    db.refresh(product)
    return product

def get_products_service(
    keyword: Optional[str],
    category: Optional[str],
    limit: int,
    page: int,
    db: Session
):
    query = db.query(Product)
    
    # Keyword search (ILIKE name)
    if keyword:
        query = query.filter(Product.name.ilike(f"%{keyword}%"))
        
    # Category filter
    if category:
        query = query.filter(Product.category == category)
        
    # Total count
    total_products = query.count()
    
    # Pagination
    page_size = min(limit or 8, 100)
    page_num = page or 1
    offset = page_size * (page_num - 1)
    
    products = query.limit(page_size).offset(offset).all()
    pages = (total_products + page_size - 1) // page_size if total_products > 0 else 0
    
    return {
        "success": True,
        "page": page_num,
        "pages": pages,
        "totalProducts": total_products,
        "products": products
    }

def get_single_product_service(product_id: str, db: Session):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    return product

def update_product_service(product_id: str, update_data: dict, db: Session):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
        
    # Iterate and set properties
    for key, value in update_data.items():
        if key == "images" and value is not None:
            # Delete old images and add new ones
            db.query(ProductImage).filter(ProductImage.product_id == product_id).delete()
            for img_url in value:
                new_img = ProductImage(
                    id=generate_object_id(),
                    product_id=product_id,
                    image_url=img_url
                )
                db.add(new_img)
        elif key == "price" and value is not None:
            product.price = Decimal(str(value))
        elif key not in ["id", "createdBy", "created_by", "reviews"]:
            if hasattr(product, key):
                setattr(product, key, value)
                
    db.commit()
    db.refresh(product)
    return product

def delete_product_service(product_id: str, db: Session):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
        
    db.delete(product)
    db.commit()
    return {
        "success": True,
        "message": "Product deleted successfully"
    }

def create_product_review_service(
    product_id: str,
    req_data: ReviewCreateRequest,
    user_id: str,
    user_name: str,
    db: Session
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
        
    # Check already reviewed
    already_reviewed = db.query(ProductReview).filter(
        ProductReview.product_id == product_id,
        ProductReview.user_id == user_id
    ).first()
    
    if already_reviewed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already reviewed this product"
        )
        
    rating_val = int(req_data.rating)
    comment_val = req_data.comment.strip()
    
    if rating_val < 1 or rating_val > 5 or not comment_val:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide a rating between 1 and 5 and a review comment"
        )
        
    review = ProductReview(
        id=generate_object_id(),
        product_id=product_id,
        user_id=user_id,
        name=user_name,
        rating=rating_val,
        comment=comment_val
    )
    
    db.add(review)
    db.commit() # Commit review so it's queryable in aggregate
    
    # Recalculate average rating and reviews count
    review_stats = db.query(
        func.count(ProductReview.id).label("cnt"),
        func.avg(ProductReview.rating).label("avg_rating")
    ).filter(ProductReview.product_id == product_id).one()
    
    product.num_reviews = review_stats.cnt
    product.ratings = Decimal(str(review_stats.avg_rating or 0.0))
    
    db.commit()
    db.refresh(product)
    
    return {
        "success": True,
        "message": "Review added successfully",
        "product": product,
        "review": review
    }
