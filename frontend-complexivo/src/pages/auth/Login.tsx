import { useNavigate } from "react-router-dom";
import "./LoginPage.css";

import logo from "../../assets/logo_espe.png";
import campus from "../../assets/campus.jpg";

export default function Login() {
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock por ahora: entra al panel
    navigate("/dashboard");
  };

  return (
    <div className="login-page">
      <div className="login-left">
        <img src={logo} alt="ESPE" className="login-logo" />

        <h1 className="login-title">Acceso al sistema de examen complexivo</h1>
        <p className="login-subtitle">
          Universidad de las Fuerzas Armadas ESPE · Tecnologías de la Información
        </p>

        <form onSubmit={handleSubmit} className="login-form">
          <div>
            <label className="login-field-label">Usuario</label>
            <div className="login-input-wrap">
              <span className="login-icon">👤</span>
              <input className="login-input" placeholder="usuario@espe.edu.ec" />
            </div>
          </div>

          <div>
            <label className="login-field-label">Contraseña</label>
            <div className="login-input-wrap">
              <span className="login-icon">🔒</span>
              <input type="password" className="login-input" placeholder="Ingresa tu contraseña" />
            </div>
          </div>

          <button type="submit" className="btn-primary">Acceder</button>
        </form>

        <div className="login-actions">
          <button className="login-link" type="button">¿Olvidó su contraseña?</button>
          <button className="login-link" type="button">Entrar como persona invitada</button>
        </div>

        <div className="login-lang">
          Idioma: <b>Español - Internacional (es)</b>
        </div>
      </div>

      <div className="login-right" style={{ backgroundImage: `url(${campus})` }} />
    </div>
  );
}
