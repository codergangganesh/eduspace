import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function KnowledgeMap() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/dashboard", { replace: true });
  }, [navigate]);

  return null;
}
