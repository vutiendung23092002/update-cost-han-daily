import dotenv from "dotenv";
dotenv.config();

export const env = {
  KIOT: {
    kiot_new: {
      retailer: process.env.KIOTVIET_RETAILER,
      client_id: process.env.KIOT_CLIENT_ID,
      client_secret: process.env.KIOT_SECRET,
    },
    kiot_old: {
      retailer: process.env.KIOTVIET_RETAILER_OLD,
      client_id: process.env.KIOT_CLIENT_ID_OLD,
      client_secret: process.env.KIOT_SECRET_OLD,
    },
  },

  LARK: {
    tiktok_k_orders_items: {
      app_id: process.env.LARK_TIKTOK_K_ORDER_ITEMS_APP_ID,
      app_secret: process.env.LARK_TIKTOK_K_ORDER_ITEMS_APP_SECRET,
    },
    tittok_k_finance: {
      // chưa có gì hẹ hẹ
    },
  },

  SUPABASE: {
    SERVICE_KEY: process.env.DATABASE_SERVICE_KEY,
  },

  AES_256_CBC: {
    APP_SECRET_KEY: process.env.AES_256_CBC_APP_SECRET_KEY,
  },
};
