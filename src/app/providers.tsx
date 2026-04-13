"use client";

import { createCache, extractStyle, StyleProvider } from "@ant-design/cssinjs";
import { ConfigProvider, theme } from "antd";
import { useServerInsertedHTML } from "next/navigation";
import { ReactNode, useMemo } from "react";
import { antdThemeToken } from "@/config/antd-theme";

type ProvidersProps = {
  children: ReactNode;
};

export function Providers({ children }: ProvidersProps) {
  const cache = useMemo(() => createCache(), []);

  useServerInsertedHTML(() => (
    <style id="antd" dangerouslySetInnerHTML={{ __html: extractStyle(cache, true) }} />
  ));

  return (
    <StyleProvider cache={cache}>
      <ConfigProvider
        theme={{
          algorithm: theme.defaultAlgorithm,
          token: antdThemeToken,
        }}
      >
        {children}
      </ConfigProvider>
    </StyleProvider>
  );
}
