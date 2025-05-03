import { Card, CardContent, Typography, Box } from "@mui/material";
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

export default function NotFound() {
  return (
    <Box sx={{ 
      minHeight: '80vh', 
      width: '100%', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      bgcolor: 'background.default' 
    }}>
      <Card sx={{ width: '100%', maxWidth: '400px', mx: 2, borderRadius: 2, boxShadow: 3 }}>
        <CardContent sx={{ pt: 3 }}>
          <Box sx={{ display: 'flex', mb: 2, alignItems: 'center', gap: 1 }}>
            <ErrorOutlineIcon sx={{ fontSize: 32, color: 'error.main' }} />
            <Typography variant="h5" component="h1" sx={{ fontWeight: 600 }}>
              404 Page Not Found
            </Typography>
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            The page you are looking for doesn't exist or has been moved.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
