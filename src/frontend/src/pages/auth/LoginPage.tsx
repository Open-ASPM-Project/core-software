import React, { useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { LockKeyhole, User, Loader2, EyeOff, Eye, Globe, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { withAPIRequest } from '@/hoc/withApiRequest';
import { API_ENDPOINTS, createEndpointUrl } from '@/config/api.config';
import FirstLoginPasswordResetDialog from './dialogs/FirstLoginPasswordResetDialog';
import FlickeringGrid from '@/components/ui/flickering-grid';
import ShineBorder from '@/components/ui/shine-border';
import { jwtDecode } from 'jwt-decode';
import SSOLoginOptionsDialog from './dialogs/SSOLoginOptionsDialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import GenerateLicenseDialog from '@/components/dialogs/GenerateLicenseDialog';
import EulaDialog from '@/components/dialogs/EulaDialog';

interface DecodedToken {
  exp: number;
  iat: number;
  role: string;
  user_id: number;
  username: string;
  // Add any other fields that are in your JWT token
}

// Form validation schema using Yup
const loginSchema = Yup.object().shape({
  username: Yup.string().required('Username is required'),
  password: Yup.string()
    .min(2, 'Password must be at least 2 characters')
    .required('Password is required'),
  remember: Yup.boolean().default(false),
});

interface LoginFormValues {
  username: string;
  password: string;
  remember: boolean;
}

interface LoginResponse {
  access_token: string;
}

interface LicenseResponse {
  valid: boolean;
}

interface FirstLoginResponse {
  is_first_login: boolean;
}

interface EulaResponse {
  id: number;
  accepted: boolean;
  acceptedAt: string;
  createdAt: string;
}

// Combined props type with HOC props
type LoginPageProps = {
  commonAPIRequest?: <T>(params: any, callback: (response: T | null) => void) => void;
};

const LoginPage: React.FC<LoginPageProps> = ({ commonAPIRequest }) => {
  const { login } = useAuth();

  const [accessToken, setAccessToken] = React.useState();
  const [isLoading, setIsLoading] = React.useState(false);
  const [showPasswordResetDialog, setShowPasswordResetDialog] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [ssoDialogOpen, setSSODialogOpen] = React.useState(false);
  const [licenseError, setLicenseError] = React.useState(false);
  const [showEulaDialog, setShowEulaDialog] = React.useState(false);

  const checkFirstLogin = () => {
    const firstLoginEndpoint = API_ENDPOINTS.auth.firstLogin;

    const serviceParams = {
      api: createEndpointUrl(firstLoginEndpoint),
      method: firstLoginEndpoint.method,
    };

    return new Promise<boolean>((resolve) => {
      commonAPIRequest<FirstLoginResponse>(serviceParams, (result) => {
        if (result) {
          setShowPasswordResetDialog(true);
          setIsLoading(false);
          return;
        }
      });
    });
  };

  const checkEulaStatus = () => {
    const eulaEndpoint = API_ENDPOINTS.auth.checkEula; // Add this endpoint in your config

    const serviceParams = {
      api: createEndpointUrl(eulaEndpoint),
      method: eulaEndpoint.method,
    };

    return new Promise<boolean>((resolve) => {
      commonAPIRequest<EulaResponse>(serviceParams, (result) => {
        if (result) {
          if (!result.accepted) {
            setShowEulaDialog(true);
            setIsLoading(false);
          }
          resolve(result.accepted);
        } else {
          resolve(false);
        }
      });
    });
  };

  useEffect(() => {
    const validateLicense = () => {
      const licenseEndpoint = API_ENDPOINTS.auth.validateLicense;
      const serviceParams = {
        api: createEndpointUrl(licenseEndpoint),
        method: licenseEndpoint.method,
      };

      return new Promise<boolean>((resolve) => {
        commonAPIRequest<LicenseResponse>(serviceParams, (result) => {
          if (result?.valid) {
            resolve(true);
          } else {
            // Handle invalid license case
            setLicenseError(true);
            setIsLoading(false);
            resolve(false);
          }
        });
      });
    };

    const initializeChecks = async () => {
      // First validate license
      const isLicenseValid = await validateLicense();

      // Only proceed to first login check if license is valid
      if (isLicenseValid) {
        checkFirstLogin();
      }
    };

    initializeChecks();
  }, []);

  const handleSuccessfulLogin = async (token: string) => {
    try {
      // Decode the token
      const decoded = jwtDecode<DecodedToken>(token);

      // Store necessary information from decoded token
      localStorage.setItem('role', decoded.role);
      localStorage.setItem('userId', decoded.user_id.toString());
      localStorage.setItem('username', decoded.username);

      // Check EULA status
      const isEulaSigned = await checkEulaStatus();

      if (isEulaSigned) {
        // Continue with login after a delay only if EULA is signed
        setTimeout(() => {
          setIsLoading(false);
          login(token);
        }, 1000);
      }
      // If EULA is not signed, the dialog will be shown via state update
    } catch (error) {
      console.error('Error in login process:', error);
      setIsLoading(false);
    }
  };

  const callLoginApiWithUserAndPassword = (values: { username: string; password: string }) => {
    const loginEndpoint = API_ENDPOINTS.auth.login;

    const serviceParams = {
      api: createEndpointUrl(loginEndpoint),
      method: API_ENDPOINTS.auth.login.method,
      data: {
        username: values.username,
        password: values.password,
      },
    };
    setIsLoading(true);

    commonAPIRequest(serviceParams, async (result: any) => {
      if (result) {
        const token = result?.access_token;
        if (token) {
          setAccessToken(token);
          await handleSuccessfulLogin(token);
        }
      } else {
        setIsLoading(false);
      }
    });
  };

  const formik = useFormik<LoginFormValues>({
    initialValues: {
      username: '',
      password: '',
      remember: false,
    },
    validationSchema: loginSchema,
    onSubmit: async (values) => {
      callLoginApiWithUserAndPassword({
        username: values.username,
        password: values.password,
      });
    },
  });

  useEffect(() => {
    checkFirstLogin();
  }, []);

  return (
    <div className="p-4 flex items-center justify-center">
      <FlickeringGrid
        className="absolute inset-0 w-full h-full [mask-image:radial-gradient(600px_circle_at_center,white,transparent)]"
        squareSize={4}
        gridGap={6}
        color="#60A5FA"
        maxOpacity={1}
        flickerChance={0.1}
      />

      <ShineBorder className=" text-2xl font-bold capitalize" color={'dark'}>
        <Card className="z-10 w-full max-w-md mx-4 shadow-xl hover:shadow-2xl transition-shadow duration-300">
          <form onSubmit={formik.handleSubmit}>
            <CardHeader className="space-y-1">
              <div className="flex justify-center mb-4">
                <div className="p-3 rounded-full bg-slate-100 dark:bg-slate-800">
                  <LockKeyhole className="w-8 h-8 text-primary" />
                </div>
              </div>
              <CardTitle className="text-2xl text-center font-bold">Welcome back</CardTitle>
              <CardDescription className="text-center">
                Enter your credentials to access your account
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium">
                  Username
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="username"
                    name="username"
                    placeholder="Enter your username"
                    className={`pl-10 ${
                      formik.touched.username && formik.errors.username ? 'border-red-500' : ''
                    }`}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    value={formik.values.username}
                    disabled={isLoading}
                  />
                </div>
                {formik.touched.username && formik.errors.username && (
                  <p className="text-xs text-red-500">{formik.errors.username}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <div className="relative">
                  <LockKeyhole className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    className={`pl-10 pr-10 ${
                      formik.touched.password && formik.errors.password ? 'border-red-500' : ''
                    }`}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    value={formik.values.password}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {formik.touched.password && formik.errors.password && (
                  <p className="text-xs text-red-500">{formik.errors.password}</p>
                )}
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </Button>

              <div className="relative w-full">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-muted" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">or</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full border-2 hover:bg-muted/50 transition-colors duration-300"
                onClick={() => setSSODialogOpen(true)}
                disabled={isLoading}
              >
                <Globe className="mr-2 h-4 w-4" />
                Login with SSO
              </Button>
            </CardFooter>
          </form>
        </Card>
      </ShineBorder>
      {showPasswordResetDialog && (
        <FirstLoginPasswordResetDialog
          isOpen={showPasswordResetDialog}
          onPasswordReset={() => setShowPasswordResetDialog(false)}
        />
      )}

      {showEulaDialog && (
        <EulaDialog
          isOpen={showEulaDialog}
          onClose={() => setShowEulaDialog(false)}
          onAccept={async () => {
            // Handle EULA acceptance
            setShowEulaDialog(false);
            // Proceed with login
            // const token = localStorage.getItem('access_token');
            if (accessToken) {
              login(accessToken);
            }
          }}
        />
      )}

      <SSOLoginOptionsDialog isOpen={ssoDialogOpen} onClose={() => setSSODialogOpen(false)} />

      <GenerateLicenseDialog
        isOpen={licenseError}
        onClose={() => setLicenseError(false)}
        commonAPIRequest={commonAPIRequest}
      />
    </div>
  );
};

export default withAPIRequest(LoginPage);
