import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import HomePage from "./pages/HomePage";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import ProtectedLayout from "./components/ProtectedLayout";
import ProfilePage from "./pages/Profile";
import AppLayout from "./components/AppLayout";
import FavoritesPage from "./pages/FavoritesPage";
import LocationPage from "./pages/LocationPage";
import PostDetailPage from "./pages/PostDetailPage";
import SignUp from "./pages/SignUp";
import ForgotPassword from "./pages/ForgotPassword";
import CreatePostPage from "./pages/CreatePostPage";
import TutorialsPage from "./pages/TutorialsPage";
import WalletPage from "./pages/WalletPage";
import MyPostsPage from "./pages/MyPostsPage";
import AdminLayout from "./components/AdminLayout";
import AdminDashboardPage from "./pages/admin/DashboardPage";
import AdminPostsPage from "./pages/admin/PostsPage";
import EditPostPage from "./pages/EditPostPage";
import AdminBlogPage from "./pages/admin/BlogPage";
import BlogPostEditorPage from "./pages/admin/BlogPostEditorPage";
import BlogPage from "./pages/BlogPage";
import BlogPostDetailPage from "./pages/BlogPostDetailPage";
import CategoriesPage from "./pages/admin/CategoriesPage";
import TagsPage from "./pages/admin/TagsPage";
import SettingsPage from "./pages/admin/SettingsPage";
import LoginHistoryPage from "./pages/LoginHistoryPage";
import UpdatePasswordPage from "./pages/UpdatePasswordPage";
import FeaturedPostsPage from "./pages/FeaturedPostsPage";
import DirectoryPage from "./pages/DirectoryPage";
import PhotoGalleryPage from "./pages/PhotoGalleryPage";
import AlbumDetailPage from "./pages/AlbumDetailPage";
import AdminDirectoryManagerPage from "./pages/admin/DirectoryManagerPage";

const queryClient = new QueryClient();

const AppContent = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        navigate('/update-password');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/update-password" element={<UpdatePasswordPage />} />
      
      <Route element={<AppLayout />}>
        {/* Public Routes - Everyone can see these */}
        <Route path="/" element={<HomePage />} />
        <Route path="/posts/:id" element={<PostDetailPage />} />
        <Route path="/tutorials" element={<TutorialsPage />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/blog/:id" element={<BlogPostDetailPage />} />
        <Route path="/directory" element={<DirectoryPage />} />
        <Route path="/photo-video" element={<PhotoGalleryPage />} />
        <Route path="/photo-video/:id" element={<AlbumDetailPage />} />

        {/* Protected Routes - Must be logged in */}
        <Route element={<ProtectedLayout />}>
          <Route path="/featured" element={<FeaturedPostsPage />} />
          <Route path="/create-post" element={<CreatePostPage />} />
          <Route path="/posts/:id/edit" element={<EditPostPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/favorites" element={<FavoritesPage />} />
          <Route path="/profile/location" element={<LocationPage />} />
          <Route path="/profile/wallet" element={<WalletPage />} />
          <Route path="/profile/my-posts" element={<MyPostsPage />} />
          <Route path="/profile/history" element={<LoginHistoryPage />} />

          {/* Admin Routes - Must be logged in as admin */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="dashboard" element={<AdminDashboardPage />} />
            <Route path="posts" element={<AdminPostsPage />} />
            <Route path="blog" element={<AdminBlogPage />} />
            <Route path="blog/new" element={<BlogPostEditorPage />} />
            <Route path="blog/:id/edit" element={<BlogPostEditorPage />} />
            <Route path="categories" element={<CategoriesPage />} />
            <Route path="tags" element={<TagsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="directory" element={<AdminDirectoryManagerPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;