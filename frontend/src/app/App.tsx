import { RouterProvider } from "react-router";
import { router } from "./routes";
import { useApp } from "./context/AppContext";
import LoadingScreen from "./components/LoadingScreen";

export default function App() {
  const { isLoading } = useApp();
  if (isLoading) return <LoadingScreen />;
  return <RouterProvider router={router} />;
}