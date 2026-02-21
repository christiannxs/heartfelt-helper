import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSetupStatus } from "@/hooks/useSetupStatus";

const Index = () => {
  const { user, loading } = useAuth();
  const { data: setupStatus, isLoading: setupLoading, isError: setupError } = useSetupStatus();

  // Em caso de erro (ex: tabela app_config não existe, migração não aplicada),
  // redireciona para /setup ao invés de ficar travado em loading
  if (setupError && !setupLoading) {
    return <Navigate to="/setup" replace />;
  }

  if (loading || setupLoading || setupStatus === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }
  if (!user) {
    if (!setupStatus.complete) return <Navigate to="/setup" replace />;
    return <Navigate to="/auth" replace />;
  }
  return <Navigate to="/dashboard" replace />;
};

export default Index;
