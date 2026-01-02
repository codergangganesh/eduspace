import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to home page where user must select their role first
    navigate("/", { replace: true });
  }, [navigate]);

  return null;
}
