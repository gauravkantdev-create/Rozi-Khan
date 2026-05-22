import useAuth from "./useAuth";

function useAuthStatus() {
  return useAuth().isAuthenticated;
}

export default useAuthStatus;
