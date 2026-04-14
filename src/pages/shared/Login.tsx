import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCompany } from '../../contexts/CompanyContext';
import { useCreator } from '../../contexts/CreatorContext';
import { AllergenSelector } from '../teacher/RecipeForm';

export const Login: React.FC = () => {
  console.log('Login component rendering');
  const { loginWithGoogle, loginWithEmail, registerWithEmail, currentUser, selectedProfile } = useAuth();
  const { companyInfo } = useCompany();
  const { creatorInfo } = useCreator();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [allergens, setAllergens] = useState<string[]>([]);

  useEffect(() => {
    console.log('Login useEffect - currentUser:', currentUser?.email, 'selectedProfile:', selectedProfile);
    if (currentUser) {
      if (selectedProfile && currentUser.profiles.includes(selectedProfile)) {
        console.log('Redirecting to dashboard:', selectedProfile);
        navigate(`/${selectedProfile}/dashboard`);
      } else {
        console.log('Redirecting to profile selector');
        navigate('/select-profile');
      }
    }
  }, [currentUser, selectedProfile, navigate]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    let success = false;
    if (isRegistering) {
      if (!name || !phone) {
        setError('Por favor, completa todos los campos.');
        setIsLoading(false);
        return;
      }
      success = await registerWithEmail(email, password, name, phone, allergens);
    } else {
      success = await loginWithEmail(email, password);
    }

    if (!success) {
      setError(isRegistering ? 'Error al registrarse. Verifica tus datos o intenta con otro correo.' : 'Error al iniciar sesión. Verifica tus credenciales.');
    }
    setIsLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-200 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-center items-center space-x-8 mb-6">
          {creatorInfo.logo && (
            <img src={creatorInfo.logo} alt="Logotipo de Manager Pro" className="h-16 w-auto object-contain" />
          )}
          {companyInfo.logo && (
            <img src={companyInfo.logo} alt="Logotipo del IES La Flota" className="h-16 w-auto object-contain" />
          )}
        </div>
        
        <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-white mb-2">
          Bienvenido a {companyInfo.name}
        </h2>
        <p className="text-center text-gray-600 dark:text-gray-300 mb-8">
          Web para la gestión de almacén de la Escuela de Hostelería del IES La Flota
        </p>
        
        {error && (
          <div className="mb-4 text-red-500 text-sm text-center font-medium">{error}</div>
        )}

        <form onSubmit={handleEmailAuth} className="space-y-4 mb-6">
          {isRegistering && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre Completo</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Teléfono</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Alérgenos (Opcional)</label>
                <div className="border rounded-md p-2 dark:border-gray-600">
                  <AllergenSelector selected={allergens} onChange={setAllergens} />
                </div>
              </div>
            </>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Correo Electrónico</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contraseña</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 px-4 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
          >
            {isLoading ? 'Procesando...' : (isRegistering ? 'Registrarse' : 'Iniciar Sesión')}
          </button>
        </form>

        <div className="text-center mb-6">
          <button
            type="button"
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-sm text-primary-600 hover:text-primary-500 dark:text-primary-400"
          >
            {isRegistering ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate para comprar'}
          </button>
        </div>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">O continuar con</span>
          </div>
        </div>

        <div className="space-y-6">
          <button
            type="button"
            onClick={async () => {
              setIsLoading(true);
              const success = await loginWithGoogle();
              if (!success) {
                setError('Error al iniciar sesión con Google.');
              }
              setIsLoading(false);
            }}
            disabled={isLoading}
            className="w-full flex justify-center items-center py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600 dark:border-white"></div>
            ) : (
              <>
                <svg className="h-5 w-5 mr-3" aria-hidden="true" viewBox="0 0 24 24">
                  <path
                    d="M12.0003 4.75C13.7703 4.75 15.3553 5.36002 16.6053 6.54998L20.0303 3.125C17.9502 1.19 15.2353 0 12.0003 0C7.31028 0 3.25527 2.69 1.28027 6.60998L5.27028 9.70498C6.21525 6.86002 8.87028 4.75 12.0003 4.75Z"
                    fill="#EA4335"
                  />
                  <path
                    d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L19.945 21.1C22.2 19.01 23.49 15.92 23.49 12.275Z"
                    fill="#4285F4"
                  />
                  <path
                    d="M5.26498 14.2949C5.02498 13.5699 4.88501 12.7999 4.88501 11.9999C4.88501 11.1999 5.01998 10.4299 5.26498 9.7049L1.275 6.60986C0.46 8.22986 0 10.0599 0 11.9999C0 13.9399 0.46 15.7699 1.28 17.3899L5.26498 14.2949Z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12.0004 24.0001C15.2404 24.0001 17.9654 22.935 19.9454 21.095L16.0804 18.095C15.0054 18.82 13.6204 19.245 12.0004 19.245C8.8704 19.245 6.21537 17.135 5.26538 14.29L1.27539 17.385C3.25539 21.31 7.3104 24.0001 12.0004 24.0001Z"
                    fill="#34A853"
                  />
                </svg>
                Continuar con Google
              </>
            )}
          </button>
        </div>
        
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