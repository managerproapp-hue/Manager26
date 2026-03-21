import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCompany } from '../../contexts/CompanyContext';
import { useCreator } from '../../contexts/CreatorContext';

export const Login: React.FC = () => {
  console.log('Login component rendering');
  const { login, changePassword, recoverMasterAccount, currentUser, selectedProfile } = useAuth();
  const { companyInfo } = useCompany();
  const { creatorInfo } = useCreator();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveryMessage, setRecoveryMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    console.log('Login useEffect - currentUser:', currentUser?.email, 'selectedProfile:', selectedProfile);
    if (currentUser && !mustChangePassword) {
      if (selectedProfile && currentUser.profiles.includes(selectedProfile)) {
        console.log('Redirecting to dashboard:', selectedProfile);
        navigate(`/${selectedProfile}/dashboard`);
      } else {
        console.log('Redirecting to profile selector');
        navigate('/select-profile');
      }
    }
  }, [currentUser, selectedProfile, navigate, mustChangePassword]);

  const handleRecover = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setRecoveryMessage('');
    setIsLoading(true);
    
    const result = await recoverMasterAccount(email, phone);
    if (result.success) {
      setRecoveryMessage(result.message);
      setIsRecovering(false);
    } else {
      setError(result.message);
    }
    setIsLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    if (mustChangePassword) {
      if (newPassword !== confirmPassword) {
        setError('Las contraseñas no coinciden.');
        setIsLoading(false);
        return;
      }
      if (newPassword.length < 6) {
        setError('La contraseña debe tener al menos 6 caracteres.');
        setIsLoading(false);
        return;
      }
      const success = await changePassword(newPassword);
      if (success) {
        setMustChangePassword(false);
      } else {
        setError('Error al cambiar la contraseña. Inténtalo de nuevo.');
      }
    } else {
      const result = await login(email, password);
      if (result.success) {
        if (result.mustChangePassword) {
          setMustChangePassword(true);
        }
      } else {
        setError('Email o contraseña incorrectos.');
      }
    }
    setIsLoading(false);
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-200 dark:bg-gray-900">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
        <div className="flex justify-center mb-6">
          <img src={companyInfo.logo} alt="Logotipo de la Empresa" className="h-12 w-auto" />
        </div>
        <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-white">
          {isRecovering ? 'Recuperar Acceso' : (mustChangePassword ? 'Cambiar Contraseña' : `Bienvenido a ${companyInfo.name}`)}
        </h2>
        
        {recoveryMessage && (
          <div className="mt-4 p-3 bg-green-100 text-green-700 text-sm rounded-md text-center">
            {recoveryMessage}
          </div>
        )}
        
        {mustChangePassword && (
          <p className="mt-2 text-sm text-center text-gray-600 dark:text-gray-400">
            Debes cambiar tu contraseña temporal antes de continuar.
          </p>
        )}
        
        <form className="mt-8 space-y-6" onSubmit={isRecovering ? handleRecover : handleSubmit}>
          {isRecovering ? (
            <>
              <div>
                <label htmlFor="recover-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Correo Electrónico Master
                </label>
                <div className="mt-1">
                  <input
                    id="recover-email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-md shadow-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="recover-phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Número de Teléfono de Recuperación
                </label>
                <div className="mt-1">
                  <input
                    id="recover-phone"
                    name="phone"
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-md shadow-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                </div>
              </div>
            </>
          ) : !mustChangePassword ? (
            <>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Correo Electrónico
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-md shadow-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Contraseña
                  </label>
                  {email === 'managerproapp@gmail.com' && (
                    <button
                      type="button"
                      onClick={() => setIsRecovering(true)}
                      className="text-xs text-primary-600 hover:text-primary-500"
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  )}
                </div>
                <div className="mt-1">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-md shadow-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Nueva Contraseña
                </label>
                <div className="mt-1">
                  <input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-md shadow-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Confirmar Nueva Contraseña
                </label>
                <div className="mt-1">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-md shadow-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                </div>
              </div>
            </>
          )}
          
          {error && (
            <div className="text-red-500 text-sm text-center font-medium">{error}</div>
          )}

          <div className="space-y-3">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-primary-400 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                isRecovering ? 'Recuperar Contraseña' : (mustChangePassword ? 'Actualizar Contraseña' : 'Iniciar Sesión')
              )}
            </button>

            {isRecovering && (
              <button
                type="button"
                onClick={() => setIsRecovering(false)}
                className="w-full text-center text-sm text-gray-600 hover:text-gray-500"
              >
                Volver al inicio de sesión
              </button>
            )}

            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={async () => {
                  localStorage.clear();
                  sessionStorage.clear();
                  if ('serviceWorker' in navigator) {
                    const registrations = await navigator.serviceWorker.getRegistrations();
                    for (const registration of registrations) {
                      await registration.unregister();
                    }
                  }
                  const databases = await window.indexedDB.databases();
                  for (const db of databases) {
                    if (db.name) window.indexedDB.deleteDatabase(db.name);
                  }
                  window.location.reload();
                }}
                className="w-full text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 underline"
              >
                ¿Problemas al entrar? Limpieza profunda y reiniciar
              </button>
            </div>
          </div>
        </form>
        
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 text-center text-xs text-gray-500">
             <p>{creatorInfo.copyright}</p>
             <a href={creatorInfo.website} target="_blank" rel="noopener noreferrer" className="hover:text-primary-400">
                 {creatorInfo.name}
             </a>
        </div>
      </div>
    </div>
  );
};
