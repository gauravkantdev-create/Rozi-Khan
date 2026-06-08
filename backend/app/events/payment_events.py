import logging

logger = logging.getLogger(__name__)

class PaymentEvents:
    @staticmethod
    def on_deposit_success(wallet_id: str, amount: float):
        logger.info(f"Event Triggered: DepositSuccess for wallet {wallet_id}. Amount: ${amount}")
        pass

    @staticmethod
    def on_payout_generated(payout_id: str, supplier_id: str, amount: float):
        logger.info(f"Event Triggered: PayoutGenerated for supplier {supplier_id}. Payout ID: {payout_id}. Amount: ${amount}")
        pass
