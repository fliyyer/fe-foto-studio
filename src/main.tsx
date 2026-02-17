import ReactDOM from "react-dom/client";
import { ConfigProvider } from "antd";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import "antd/dist/reset.css";

// Global Ant Design theme setup with Equinox palette.
ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <ConfigProvider
    theme={{
      token: {
        colorPrimary: "#00bfc3",
        colorInfo: "#00bfc3",
        colorSuccess: "#00bfc3",
        colorWarning: "#ffd33b",
        colorError: "#ff2273",
        colorTextBase: "#000000",
        colorBgBase: "#ffffff",
        borderRadius: 4,
        fontFamily: "Poppins, system-ui, -apple-system, Segoe UI, sans-serif",
      },
      components: {
        Layout: {
          headerBg: "#ffffff",
          siderBg: "#ffffff",
          bodyBg: "#ffffff",
        },
        Menu: {
          itemBg: "#ffffff",
          itemColor: "#000000",
          itemHoverColor: "#ff2273",
          itemSelectedColor: "#000000",
          itemSelectedBg: "#ffd33b",
          activeBarBorderWidth: 0,
          itemBorderRadius: 2,
        },
        Card: {
          borderRadiusLG: 4,
          colorBorderSecondary: "#000000",
        },
        Table: {
          headerBg: "#00bfc3",
          headerColor: "#000000",
        },
        Button: {
          primaryShadow: "4px 4px 0 #000000",
        },
      },
    }}
  >
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </ConfigProvider>,
);
