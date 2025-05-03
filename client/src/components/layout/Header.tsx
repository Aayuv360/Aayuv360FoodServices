import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  IconButton, 
  Box, 
  Menu,
  MenuItem, 
  Avatar,
  Badge,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Divider,
  useTheme,
  Container
} from "@mui/material";
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import CartSidebar from "@/components/cart/CartSidebar";

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { cartItems } = useCart();

  // Close mobile menu when location changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const toggleCart = () => {
    setCartOpen(!cartOpen);
  };

  // User menu state
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const theme = useTheme();
  
  const handleUserMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleUserMenuClose = () => {
    setAnchorEl(null);
  };
  
  const handleLogout = () => {
    logout();
    handleUserMenuClose();
  };

  return (
    <>
      <AppBar position="sticky" elevation={1} color="default" sx={{ bgcolor: 'white' }}>
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ py: 1 }}>
            {/* Logo */}
            <Box sx={{ flexGrow: 0, display: 'flex', alignItems: 'center', mr: 2 }}>
              <Link href="/">
                <Box component="a" sx={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
                  <Box 
                    sx={{ 
                      height: 40, 
                      width: 40, 
                      mr: 1, 
                      bgcolor: 'primary.main', 
                      borderRadius: '50%', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: '1.2rem'
                    }}
                  >
                    M
                  </Box>
                  <Typography 
                    variant="h5" 
                    component="span"
                    sx={{ 
                      color: 'primary.main', 
                      fontWeight: 700,
                      display: { xs: 'none', sm: 'block' }
                    }}
                  >
                    MealMillet
                  </Typography>
                </Box>
              </Link>
            </Box>
            
            {/* Desktop Navigation */}
            <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' }, gap: 4 }}>
              <Link href="/">
                <Button 
                  component="a"
                  sx={{ 
                    color: location === "/" ? 'primary.main' : 'text.primary',
                    '&:hover': { color: 'primary.main', bgcolor: 'transparent' }
                  }}
                >
                  Home
                </Button>
              </Link>
              <Link href="/menu">
                <Button 
                  component="a"
                  sx={{ 
                    color: location === "/menu" ? 'primary.main' : 'text.primary',
                    '&:hover': { color: 'primary.main', bgcolor: 'transparent' }
                  }}
                >
                  Menu
                </Button>
              </Link>
              <Link href="/subscription">
                <Button 
                  component="a"
                  sx={{ 
                    color: location === "/subscription" ? 'primary.main' : 'text.primary',
                    '&:hover': { color: 'primary.main', bgcolor: 'transparent' }
                  }}
                >
                  Plans
                </Button>
              </Link>
            </Box>
            
            {/* Actions Area */}
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {/* Cart Button */}
              <IconButton color="inherit" onClick={toggleCart} sx={{ mr: 1 }}>
                <Badge badgeContent={cartItems.length} color="primary">
                  <ShoppingCartIcon />
                </Badge>
              </IconButton>
              
              {/* User Menu or Auth Buttons */}
              {user ? (
                <Box>
                  <Button
                    sx={{ 
                      textTransform: 'none',
                      pl: 1,
                      pr: { xs: 1, md: 1.5 }
                    }}
                    onClick={handleUserMenuClick}
                    endIcon={<KeyboardArrowDownIcon />}
                  >
                    <Avatar 
                      sx={{ width: 32, height: 32, mr: { xs: 0, md: 1 } }}
                      src={`https://ui-avatars.com/api/?name=${user.name}&background=random`}
                      alt={user.name}
                    >
                      {user.name.charAt(0)}
                    </Avatar>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        display: { xs: 'none', md: 'block' },
                        ml: 1
                      }}
                    >
                      {user.name.split(' ')[0]}
                    </Typography>
                  </Button>
                  <Menu
                    anchorEl={anchorEl}
                    open={open}
                    onClose={handleUserMenuClose}
                    transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                    anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                  >
                    <Link href="/profile">
                      <MenuItem component="a" onClick={handleUserMenuClose}>
                        Your Profile
                      </MenuItem>
                    </Link>
                    <Link href="/subscription">
                      <MenuItem component="a" onClick={handleUserMenuClose}>
                        Subscription
                      </MenuItem>
                    </Link>
                    <Divider />
                    <MenuItem onClick={handleLogout}>Sign out</MenuItem>
                  </Menu>
                </Box>
              ) : (
                <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1 }}>
                  <Link href="/login">
                    <Button color="inherit" component="a">Login</Button>
                  </Link>
                  <Link href="/register">
                    <Button variant="contained" color="primary" component="a">Register</Button>
                  </Link>
                </Box>
              )}
              
              {/* Mobile Menu Button */}
              <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="end"
                onClick={toggleMobileMenu}
                sx={{ ml: 1, display: { md: 'none' } }}
              >
                {mobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
              </IconButton>
            </Box>
          </Toolbar>
        </Container>
        
        {/* Mobile Menu Drawer */}
        <Drawer
          anchor="left"
          open={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 240 },
          }}
        >
          <Box sx={{ p: 2 }}>
            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                mb: 2,
                p: 1
              }}
            >
              <Box 
                sx={{ 
                  height: 40, 
                  width: 40, 
                  mr: 1, 
                  bgcolor: 'primary.main', 
                  borderRadius: '50%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '1.2rem'
                }}
              >
                M
              </Box>
              <Typography 
                variant="h6" 
                component="span"
                sx={{ 
                  color: 'primary.main', 
                  fontWeight: 700
                }}
              >
                MealMillet
              </Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <List>
              <Link href="/">
                <ListItem 
                  button 
                  component="a" 
                  onClick={() => setMobileMenuOpen(false)}
                  sx={{ 
                    borderRadius: 1, 
                    mb: 1, 
                    bgcolor: location === "/" ? 'action.selected' : 'transparent' 
                  }}
                >
                  <ListItemText primary="Home" />
                </ListItem>
              </Link>
              <Link href="/menu">
                <ListItem 
                  button 
                  component="a" 
                  onClick={() => setMobileMenuOpen(false)}
                  sx={{ 
                    borderRadius: 1, 
                    mb: 1, 
                    bgcolor: location === "/menu" ? 'action.selected' : 'transparent' 
                  }}
                >
                  <ListItemText primary="Menu" />
                </ListItem>
              </Link>
              <Link href="/subscription">
                <ListItem 
                  button 
                  component="a" 
                  onClick={() => setMobileMenuOpen(false)}
                  sx={{ 
                    borderRadius: 1, 
                    mb: 1, 
                    bgcolor: location === "/subscription" ? 'action.selected' : 'transparent' 
                  }}
                >
                  <ListItemText primary="Plans" />
                </ListItem>
              </Link>
              {!user && (
                <>
                  <Link href="/login">
                    <ListItem 
                      button 
                      component="a" 
                      onClick={() => setMobileMenuOpen(false)}
                      sx={{ 
                        borderRadius: 1, 
                        mb: 1, 
                        bgcolor: location === "/login" ? 'action.selected' : 'transparent' 
                      }}
                    >
                      <ListItemText primary="Login" />
                    </ListItem>
                  </Link>
                  <Link href="/register">
                    <ListItem 
                      button 
                      component="a" 
                      onClick={() => setMobileMenuOpen(false)}
                      sx={{ 
                        borderRadius: 1, 
                        mb: 1, 
                        bgcolor: location === "/register" ? 'action.selected' : 'transparent' 
                      }}
                    >
                      <ListItemText primary="Register" />
                    </ListItem>
                  </Link>
                </>
              )}
            </List>
          </Box>
        </Drawer>
      </AppBar>

      {/* Cart Sidebar */}
      <CartSidebar open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
};

export default Header;
