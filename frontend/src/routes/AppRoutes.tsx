import { Navigate, Route, Routes } from "react-router-dom";

import { AuthLayout } from "../layouts/AuthLayout";
import { MainLayout } from "../layouts/MainLayout";
import { DashboardPage } from "../pages/DashboardPage";
import { LoginPage } from "../pages/LoginPage";
import { MusicCriticPage } from "../pages/MusicCriticPage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { PlaylistArchitectPage } from "../pages/PlaylistArchitectPage";
import { PlaylistDetailPage } from "../pages/PlaylistDetailPage";
import { PlaylistsPage } from "../pages/PlaylistsPage";
import { ProfilePage } from "../pages/ProfilePage";
import { RecommendationsPage } from "../pages/RecommendationsPage";
import { RoutePlaylistPage } from "../pages/RoutePlaylistPage";
import { SkipPredictorPage } from "../pages/SkipPredictorPage";
import { SoundMapPage } from "../pages/SoundMapPage";
import { TasteInsightsPage } from "../pages/TasteInsightsPage";
import { ProtectedRoute } from "./ProtectedRoute";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />

      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/playlist-architect" element={<PlaylistArchitectPage />} />
          <Route path="/playlists" element={<PlaylistsPage />} />
          <Route path="/playlists/:playlistId" element={<PlaylistDetailPage />} />
          <Route path="/music-critic" element={<MusicCriticPage />} />
          <Route path="/recommendations" element={<RecommendationsPage />} />
          <Route path="/taste-insights" element={<TasteInsightsPage />} />
          <Route path="/sound-map" element={<SoundMapPage />} />
          <Route path="/route-playlist" element={<RoutePlaylistPage />} />
          <Route path="/skip-predictor" element={<SkipPredictorPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
