// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Typography,
  FormGroup,
  FormControlLabel,
  Button,
  Stack,
  Divider,
  createTheme,
  ThemeProvider,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { Link } from 'react-router';
import { AnimatePresence, motion, MotionProps } from 'framer-motion';
import { loginType } from 'src/types/auth/auth';
import CustomCheckbox from '../../../components/forms/theme-elements/CustomCheckbox';
import CustomTextField from '../../../components/forms/theme-elements/CustomTextField';
import CustomFormLabel from '../../../components/forms/theme-elements/CustomFormLabel';
import axiosServices from 'src/utils/axios';
import { jwtDecode } from 'jwt-decode';
import { IconEye, IconEyeOff } from '@tabler/icons-react';
import _ from 'lodash';
import { baseDarkTheme, baselightTheme } from 'src/theme/DefaultColors';
import typography from 'src/theme/Typography';
import { shadows } from 'src/theme/Shadows';
import components from 'src/theme/Components';

import AuthSocialButtons from './AuthSocialButtons';

type NativeFormProps = React.ComponentPropsWithoutRef<'form'>;

type JwtPayload = {
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier': string;
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress': string;
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name': string;
  fullName: string;
  groupId: string;
  ApplicationId: string;
  groupName: string;
  'http://schemas.microsoft.com/ws/2008/06/identity/claims/role': string;
  level: string;
  isHead: string;
  accessibleBuildings: string;
  exp: number;
};

const MotionForm = motion(
  React.forwardRef<HTMLFormElement, NativeFormProps & MotionProps>((props, ref) => (
    <form ref={ref} {...props} />
  )),
);

const ADMIN_API_URL = '/api/Auth/login';

const baseMode: any = {
  palette: {
    mode: 'light',
  },
  shape: {
    borderRadius: 7,
  },
  shadows: shadows,
  typography: typography,
};

const loginTheme = createTheme(_.merge({}, baseMode, baseDarkTheme));
loginTheme.components = components(loginTheme);

const AuthLogin = ({ title, subtitle, subtext }: loginType) => {

  const [direction, setDirection] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  const [adminCreds, setAdminCreds] = useState({ email: '', password: '' });
  const [rememberMe, setRememberMe] = useState(true);

  const usernameRef = useRef<HTMLInputElement>(null);

    // ✅ Auto-fill remembered usernames on mount
  useEffect(() => {
    const savedAdmin = localStorage.getItem('rememberedAdminUsername');
    const savedRememberMe = localStorage.getItem('rememberMePreference');

    if (savedAdmin) {
      setAdminCreds((prev) => ({ ...prev, email: savedAdmin }));
    }
    if (savedRememberMe !== null) {
      setRememberMe(savedRememberMe === 'true');
    }
  }, []);

const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const url = ADMIN_API_URL;
    console.log("Cred: ", adminCreds)
    try {
      const res = await axiosServices.post(url, adminCreds);
      const data = res?.data?.data;
      console.log("Result: ", data)
      if (data?.token) {
        localStorage.setItem('token', data.token);
        
        // ✅ decode JWT
        const decoded = jwtDecode<JwtPayload>(data.token);

        // mapping from JWT
        // const email = decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'];
        // const email = decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'];
        // const levelPriority =
        //   decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
        // const applicationId = decoded['ApplicationId'];

        // save to localStorage
        // if (email) localStorage.setItem('email', email);
        // if (email) localStorage.setItem('email', email);
        // if (levelPriority) localStorage.setItem('levelPriority', levelPriority.trim());
        // if (applicationId && levelPriority.trim() !== 'System')
        //   localStorage.setItem('applicationId', applicationId);

        // optional extras
        // if (decoded.fullName) localStorage.setItem('fullName', decoded.fullName);
        // if (decoded.groupName) localStorage.setItem('groupName', decoded.groupName);
        // handle accessibleBuildings (comma-separated string → array)
        // if (decoded.accessibleBuildings) {
        //   const buildingsArray = decoded.accessibleBuildings
        //     .split(',')
        //     .map((id) => id.trim())
        //     .filter(Boolean); // remove empty values

        //   localStorage.setItem('accessibleBuildings', JSON.stringify(buildingsArray));
        // }

        // ✅ Handle "Remember this Device" logic
        if (rememberMe) {
          localStorage.setItem('rememberedAdminUsername', adminCreds.email);
          localStorage.setItem('rememberMePreference', 'true');
        } else {
          localStorage.removeItem('rememberedAdminUsername');
          localStorage.setItem('rememberMePreference', 'false');
        }
      }
      if (data?.role === 'Admin'){
        localStorage.setItem('role', 'Admin');
        // localStorage.setItem('siteId', 'd612e6ce-028a-419c-a568-d053fb281efc')
      }
      if (data?.siteIds && data.siteIds.length > 0) {
        localStorage.setItem('siteIds', JSON.stringify(data.siteIds));
      }
      if (data?.refreshToken) {
        localStorage.setItem('refreshToken', data.refreshToken);
      }

      localStorage.setItem('response', JSON.stringify(data));
      localStorage.setItem('welcomePopupShown', 'false');

      // ❗ IMPORTANT: use decoded role instead of data.levelPriority
      // const role = jwtDecode<JwtPayload>(data.token)[
      //   'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'
      // ];

      // if (role === 'Primary') {
      //   setLoginError('You do not have permission to login as Admin');
      //   return;
      // }

      setTimeout(() => {
        window.location.href = '/dashboards/modern'

        console.log('decoded', jwtDecode(data.token));
      }, 300);
    } catch (err) {
      console.log("Error: ", err)
      setLoginError('Invalid email or password. Please try again.');
      setAdminCreds({ email: '', password: '' })

      requestAnimationFrame(() => {
        usernameRef.current?.focus();
      });
    }
  };

return (
  <ThemeProvider theme={loginTheme}>
    {title && (
      <Typography fontWeight={700} variant="h3" mb={1}>
        {title}
      </Typography>
    )}

    {subtext}

    <Box mt={3}>
      <Divider>
        <Typography
          component="span"
          color="textSecondary"
          variant="h6"
          fontWeight={400}
          px={2}
        >
          Sign in to continue
        </Typography>
      </Divider>
    </Box>

    {loginError && (
      <Typography
        variant="body2"
        color="error"
        textAlign="center"
        sx={{
          backgroundColor: "#ffebee",
          border: "1px solid #ffcdd2",
          borderRadius: 1,
          p: 1,
          mt: 2,
          mb: 2,
        }}
      >
        {loginError}
      </Typography>
    )}

    <Box
      component="form"
      onSubmit={handleSubmit}
      mt={3}
    >
      <Stack spacing={2}>
        <Box>
          <CustomFormLabel htmlFor="email">
            Email
          </CustomFormLabel>

          <CustomTextField
            id="email"
            fullWidth
            inputRef={usernameRef}
            value={adminCreds.email}
            onChange={(e: any) =>
              setAdminCreds((prev: any) => ({
                ...prev,
                email: e.target.value,
              }))
            }
          />
        </Box>

        <Box>
          <CustomFormLabel htmlFor="password">
            Password
          </CustomFormLabel>

          <CustomTextField
            
            id="password"
            fullWidth
            type={showPassword ? "text" : "password"}
            value={adminCreds.password}
            onChange={(e: any) =>
              setAdminCreds((prev: any) => ({
                ...prev,
                password: e.target.value,
              }))
            }
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword((p) => !p)}
                    edge="end"
                  >
                    {showPassword ? (
                      <IconEyeOff size={20} />
                    ) : (
                      <IconEye size={20} />
                    )}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Box>

        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <FormGroup>
            <FormControlLabel
              control={
                <CustomCheckbox
                  checked={rememberMe}
                  onChange={(e) =>
                    setRememberMe(e.target.checked)
                  }
                />
              }
              label="Remember this Device"
            />
          </FormGroup>

          <Typography
            component={Link}
            to="/auth/forgot-password"
            fontWeight={500}
            sx={{
              textDecoration: "none",
              color: "primary.main",
            }}
          >
            Forgot Password?
          </Typography>
        </Stack>

        <Button
          type="submit"
          fullWidth
          size="large"
          variant="contained"
        >
          Sign In
        </Button>
      </Stack>
    </Box>

    {subtitle}
  </ThemeProvider>
);
};

export default AuthLogin;
