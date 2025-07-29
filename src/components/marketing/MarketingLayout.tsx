import { Outlet } from "react-router-dom";
import MarketingNav from "./MarketingNav";
import MarketingFooter from "./MarketingFooter";

const MarketingLayout = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <MarketingNav />
      <main className="flex-1">
        <Outlet />
      </main>
      <MarketingFooter />
    </div>
  );
};

export default MarketingLayout;