import { useCallback, useEffect, useRef, useState } from "react";
import { useLoginWithGoogle } from "@/hooks/useAuth";
import { authStorage } from "@/lib/auth";
import { toast } from "sonner";

interface GoogleIdentitySignInResponse {
  credential: string;
}

interface GoogleAccountsId {
  initialize: (config: {
    client_id: string;
    callback: (response: GoogleIdentitySignInResponse) => void;
  }) => void;
  renderButton: (
    element: HTMLElement | null,
    options: {
      theme: string;
      size: string;
      text: string;
      width: string;
    }
  ) => void;
  prompt: () => void;
}

interface GoogleAccounts {
  id: GoogleAccountsId;
}

declare global {
  interface Window {
    google?: {
      accounts: GoogleAccounts;
    };
  }
}

interface GoogleSignInButtonProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  disabled?: boolean;
}

export function GoogleSignInButton({ onSuccess, onError, disabled }: GoogleSignInButtonProps) {
  const { mutate: loginWithGoogle, isPending } = useLoginWithGoogle();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);

  // Initialize Google Sign-In
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google?.accounts) {
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          callback: (response: GoogleIdentitySignInResponse) => {
            if (response.credential) {
              loginWithGoogle(
                { idToken: response.credential },
                {
                  onSuccess: (data) => {
                    authStorage.setAccessToken(data.accessToken);
                    authStorage.setUser(data.user);
                    toast.success("Đăng nhập bằng Google thành công");
                    onSuccess?.();
                  },
                  onError: (error: unknown) => {
                    const err = error as { response?: { data?: { message?: string } } } | null;
                    const errorMessage = err?.response?.data?.message || "Đăng nhập bằng Google thất bại";
                    toast.error(errorMessage);
                    onError?.(errorMessage);
                  },
                }
              );
            }
          },
        });
        setIsGoogleLoaded(true);
      }
    };
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [loginWithGoogle, onSuccess, onError]);

  // Render button when Google is loaded
  useEffect(() => {
    if (isGoogleLoaded && containerRef.current && window.google?.accounts) {
      window.google.accounts.id.renderButton(containerRef.current, {
        theme: "outline",
        size: "large",
        text: "signin_with",
        width: "100%",
      });
    }
  }, [isGoogleLoaded]);

  const handleClick = useCallback(() => {
    if (!window.google?.accounts) {
      toast.error("Google Sign-In is not loaded. Please refresh the page.");
      return;
    }
    // Trigger the consent flow
    window.google.accounts.id.prompt();
  }, []);

  return (
    <div className="w-full" onClick={disabled || isPending ? undefined : handleClick}>
      <div ref={containerRef} style={{ width: "100%", pointerEvents: disabled || isPending ? "none" : "auto", opacity: disabled || isPending ? 0.6 : 1 }} />
    </div>
  );
}
