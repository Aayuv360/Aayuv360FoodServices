import { useState } from "react";
import { useLocation } from "wouter";
import { useCart } from "@/hooks/use-cart";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useSnackbar } from 'notistack';
import { 
  Box, 
  Typography, 
  Button, 
  IconButton, 
  Drawer, 
  Divider,
  Paper,
  Stack,
  Grid
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';

interface CartSidebarProps {
  open: boolean;
  onClose: () => void;
}

const CartSidebar = ({ open, onClose }: CartSidebarProps) => {
  const [loading, setLoading] = useState(false);
  const [_, navigate] = useLocation();
  const { cartItems, updateCartItem, removeCartItem, clearCart } = useCart();
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useAuth();

  // Calculate totals
  const subtotal = cartItems.reduce(
    (sum, item) => sum + (item.meal?.price || 0) * item.quantity,
    0
  );
  const deliveryFee = 4000; // ₹40
  const tax = 2000; // ₹20
  const total = subtotal + deliveryFee + tax;

  // Format price in Indian Rupees
  const formatPrice = (price: number) => {
    return `₹${(price / 100).toFixed(2)}`;
  };

  const handleQuantityChange = async (id: number, quantity: number) => {
    if (quantity < 1) return;
    updateCartItem(id, quantity);
  };

  const handleRemoveItem = (id: number) => {
    removeCartItem(id);
  };

  const handleCheckout = async () => {
    if (!user) {
      enqueueSnackbar("You need to be logged in to checkout", { 
        variant: "error", 
        anchorOrigin: { vertical: 'top', horizontal: 'center' } 
      });
      onClose();
      navigate("/login");
      return;
    }

    if (cartItems.length === 0) {
      enqueueSnackbar("Your cart is empty. Add some items first.", { 
        variant: "warning",
        anchorOrigin: { vertical: 'top', horizontal: 'center' }
      });
      return;
    }

    navigate("/checkout");
    onClose();
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDrawer-paper': { 
          width: { xs: '100%', sm: 400 }, 
          boxShadow: 3 
        },
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Header */}
        <Box sx={{ 
          p: 2, 
          borderBottom: 1, 
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Typography variant="h6" component="h3">
            Your Cart
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Cart Items */}
        <Box sx={{ 
          flexGrow: 1, 
          overflowY: 'auto', 
          p: 2 
        }}>
          {cartItems.length === 0 ? (
            <Box sx={{ 
              textAlign: 'center', 
              py: 4,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center' 
            }}>
              <ShoppingCartOutlinedIcon 
                sx={{ 
                  fontSize: 64, 
                  color: 'text.disabled',
                  mb: 2 
                }} 
              />
              <Typography color="text.secondary" sx={{ mb: 2 }}>
                Your cart is empty
              </Typography>
              <Button 
                variant="contained" 
                onClick={() => {
                  navigate("/menu");
                  onClose();
                }}
              >
                Browse Menu
              </Button>
            </Box>
          ) : (
            <Stack spacing={2}>
              {cartItems.map((item) => (
                <Paper
                  key={item.id}
                  elevation={0}
                  sx={{ 
                    p: 2, 
                    bgcolor: 'background.default',
                    borderRadius: 2
                  }}
                >
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={3} sm={2}>
                      <Box 
                        component="img"
                        src={item.meal?.imageUrl || ''}
                        alt={item.meal?.name || 'Meal image'}
                        sx={{ 
                          width: '100%', 
                          aspectRatio: '1', 
                          objectFit: 'cover',
                          borderRadius: 1
                        }}
                      />
                    </Grid>
                    <Grid item xs={9} sm={5}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {item.meal?.name}
                      </Typography>
                      <Typography 
                        variant="body2" 
                        color="primary.main" 
                        sx={{ fontWeight: 600 }}
                      >
                        {formatPrice(item.meal?.price || 0)}
                      </Typography>
                    </Grid>
                    <Grid item xs={9} sm={3}>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        border: 1,
                        borderColor: 'divider',
                        borderRadius: 1,
                        width: 'fit-content'
                      }}>
                        <IconButton
                          size="small"
                          onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                        >
                          <RemoveIcon fontSize="small" />
                        </IconButton>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            px: 1,
                            minWidth: 24,
                            textAlign: 'center' 
                          }}
                        >
                          {item.quantity}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                        >
                          <AddIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Grid>
                    <Grid item xs={3} sm={2} sx={{ textAlign: 'right' }}>
                      <IconButton
                        size="small"
                        onClick={() => handleRemoveItem(item.id)}
                        sx={{ color: 'text.secondary' }}
                      >
                        <DeleteOutlineIcon />
                      </IconButton>
                    </Grid>
                  </Grid>
                </Paper>
              ))}
            </Stack>
          )}
        </Box>

        {/* Footer with Summary */}
        <Box sx={{ 
          p: 2, 
          borderTop: 1, 
          borderColor: 'divider' 
        }}>
          <Box sx={{ mb: 2 }}>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              mb: 1 
            }}>
              <Typography variant="body2" color="text.secondary">
                Subtotal
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {formatPrice(subtotal)}
              </Typography>
            </Box>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              mb: 1 
            }}>
              <Typography variant="body2" color="text.secondary">
                Delivery Fee
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {formatPrice(deliveryFee)}
              </Typography>
            </Box>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              mb: 2 
            }}>
              <Typography variant="body2" color="text.secondary">
                Tax
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {formatPrice(tax)}
              </Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              mb: 3 
            }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Total
              </Typography>
              <Typography 
                variant="subtitle1" 
                color="primary.main" 
                sx={{ fontWeight: 700 }}
              >
                {formatPrice(total)}
              </Typography>
            </Box>
          </Box>
          
          <Button
            variant="contained"
            color="primary"
            fullWidth
            onClick={handleCheckout}
            disabled={cartItems.length === 0 || loading}
            sx={{ py: 1.5 }}
          >
            Proceed to Checkout
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
};

export default CartSidebar;
