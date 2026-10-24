// File: nesora-app/src/app/(tabs)/buy.tsx
import { Redirect } from "expo-router";

// The "+" tab opens Buy storage on the website (see the tab button in _layout).
// If this route is ever reached directly, go Home.
export default function BuyRedirect() {
  return <Redirect href="/" />;
}