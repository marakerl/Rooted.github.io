import { useState } from "react";
import { Navigate } from "react-router-dom";
import { Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export default function Login() {
  const { session, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  if (loading) return null;
  if (session) return <Navigate to="/" replace />;

  const checkAllowlistOrSignOut = async () => {
    const { data: allowed, error } = await supabase.rpc("is_email_allowed");
    if (error || !allowed) {
      await supabase.auth.signOut();
      toast.error("This email is not authorized to access the app.");
      return false;
    }
    return true;
  };

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) {
      setBusy(false);
      return toast.error(error.message);
    }
    const ok = await checkAllowlistOrSignOut();
    setBusy(false);
    if (ok) toast.success("Welcome back");
  };

  const signUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      return toast.error("Password must be at least 6 characters");
    }
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { emailRedirectTo: `${window.location.origin}/` },
    });
    if (error) {
      setBusy(false);
      return toast.error(error.message);
    }
    if (data.session) {
      const ok = await checkAllowlistOrSignOut();
      setBusy(false);
      if (ok) toast.success("Account created");
    } else {
      setBusy(false);
      toast.success("Check your email to confirm, then sign in.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="w-full max-w-md shadow-leaf border-border/60">
        <CardContent className="p-8">
          <div className="flex flex-col items-center text-center mb-7">
            <div className="h-14 w-14 rounded-full bg-gradient-leaf flex items-center justify-center shadow-leaf mb-3">
              <Leaf className="h-7 w-7 text-primary-foreground" />
            </div>
            <h1 className="font-display text-3xl font-semibold">Rooted</h1>
            <p className="text-muted-foreground text-sm mt-1">Sign in to your journal</p>
          </div>

          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Sign up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={signIn} className="space-y-4">
                <div>
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1.5"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="signin-password">Password</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1.5"
                    required
                  />
                </div>
                <Button type="submit" disabled={busy} className="w-full">
                  {busy ? "Signing in..." : "Sign in"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={signUp} className="space-y-4">
                <div>
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1.5"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1.5"
                    required
                    minLength={6}
                  />
                </div>
                <Button type="submit" disabled={busy} className="w-full">
                  {busy ? "Creating..." : "Create account"}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Your email must be on the allowlist to access the app.
                </p>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
