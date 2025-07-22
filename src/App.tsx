import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          
          <Route element={<AppLayout />}>
            {/* Public Routes */}
            <Route path="/tutorials" element={<TutorialsPage />} />
            <Route path="/blog" element={<BlogPage />} />
            <Route path="/blog/:id" element={<BlogPostDetailPage />} />

            {/* Protected Routes */}
            <Route element={<ProtectedLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/create-post" element={<CreatePostPage />} />
              <Route path="/posts/:id" element={<PostDetailPage />} />
              <Route path="/posts/:id/edit" element={<EditPostPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/profile/favorites" element={<FavoritesPage />} />
              <Route path="/profile/location" element={<LocationPage />} />
              <Route path="/profile/wallet" element={<WalletPage />} />
              <Route path="/profile/my-posts" element={<MyPostsPage />} />

              {/* Admin Routes */}
              <Route path="/admin" element={<AdminLayout />}>
                <Route path="dashboard" element={<AdminDashboardPage />} />
                <Route path="posts" element={<AdminPostsPage />} />
                <Route path="blog" element={<AdminBlogPage />} />
                <Route path="blog/new" element={<BlogPostEditorPage />} />
                <Route path="blog/:id/edit" element={<BlogPostEditorPage />} />
                <Route path="categories" element={<CategoriesPage />} />
                <Route path="tags" element={<TagsPage />} />
              </Route>
            </Route>
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;