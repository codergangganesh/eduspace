declare module '@monaco-editor/react' {
  import * as React from 'react';

  export type OnMount = (editor: any, monaco: any) => void;
  export type OnChange = (value: string | undefined, ev: any) => void;

  export interface EditorProps {
    value?: string;
    language?: string;
    onChange?: OnChange;
    onMount?: OnMount;
    theme?: string;
    height?: string | number;
    width?: string | number;
    readOnly?: boolean;
    options?: Record<string, any>;
    loading?: React.ReactNode;
    className?: string;
    defaultValue?: string;
  }

  const Editor: React.FC<EditorProps>;
  export default Editor;
}
