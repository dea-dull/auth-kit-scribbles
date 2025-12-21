import React, { useState, useEffect } from "react";
import PasswordInputBox from "../ui/PasswordInputBox.jsx";
import WhiteButton from "../ui/WhiteButton.jsx";
import GlassButton from "../ui/Button.jsx";
import { notify } from "../ui/Notify.jsx";
import { useNavigate, useLocation } from "react-router-dom";
import PasswordStrength from "../ui/PasswordStrength.jsx";
import styles from "./ResetPassword.module.css";



const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const params = new URLSearchParams(location.search);
  const maskedEmail = params.get("maskedEmail") || "";


  const [tokenValid, setTokenValid] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const API_URL = import.meta.env.VITE_API_URL || "https://your-api-url.com";

  // ✅ Front-end password validation (mirror Cognito policy)
  const isPasswordValid = (password) => {
    const minLength = 8;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return (
      password.length >= minLength &&
      hasUpper &&
      hasLower &&
      hasNumber &&
      hasSpecial
    );
  };

  // Validate token on page load
  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const token = query.get("token");

    if (!token) {
      navigate("/login");
      return;
    }

    fetch(`${API_URL}/validate-reset-token?token=${encodeURIComponent(token)}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.valid) {
          notify.error("Reset link is invalid or expired.");
          navigate("/login");
        } else {
          setEmail(data.email);
          setTokenValid(true);
        }
      })
      .catch(() => {
        notify.error("Could not validate reset link.");
        navigate("/login");
      })
      .finally(() => setLoading(false));
  }, [location.search]);

  const handleResetPassword = async () => {
    const query = new URLSearchParams(location.search);
    const token = query.get("token");

    if (newPassword !== confirmPassword) {
      notify.error("Passwords do not match.");
      return;
    }

    if (!isPasswordValid(newPassword)) {
      notify.error(
        "Password does not meet requirements."
      );
      return;
    }

    try {
      const res = await fetch(`${API_URL}/confirm-reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        notify.error( data.error || "Could not reset password. Try again later.");
        return;
      }

      notify.success("Password has been reset successfully.");
      navigate("/login");
    } catch (err) {
      console.error(err);
      notify.error("Could not reset password. Try again later.");
    }
  };

  if (loading) return <p>Loading...</p>;

  if (!tokenValid) return null; // prevent UI flicker

  return (
    <div className={styles.container}>
      <h1>Reset Password</h1>

      {maskedEmail && (
        <p className={styles.emailHeader}>
          Password reset for <span className={styles.emailText}>{maskedEmail}</span>
        </p>
      )}

      <p className={styles.subtitle}>Enter and confirm your new password below</p>

      <PasswordInputBox
        placeholder="Enter new password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
      />

      <PasswordStrength password={newPassword} />

      <PasswordInputBox
        placeholder="Confirm new password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
      />

      <WhiteButton onClick={handleResetPassword}>Reset Password</WhiteButton>
      <GlassButton onClick={() => navigate("/login")}>Cancel</GlassButton>
    </div>
  );
};

export default ResetPasswordPage;
