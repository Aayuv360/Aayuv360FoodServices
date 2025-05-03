import { createRoot } from "react-dom/client";
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { QueryClientProvider } from '@tanstack/react-query';
import App from "./App";
import "./index.css";
import theme from './lib/theme';
import { queryClient } from './lib/queryClient';

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </QueryClientProvider>
);
