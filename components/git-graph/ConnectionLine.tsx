import { ConnectionPath } from '@/lib/types/git-graph';
import { LAYOUT_CONFIG } from '@/lib/utils/graph-layout';

interface ConnectionLineProps {
  connection: ConnectionPath;
}

export function ConnectionLine({ connection }: ConnectionLineProps) {
  return (
    <path
      d={connection.d}
      stroke={LAYOUT_CONFIG.CLAUDE_COLOR}
      strokeWidth={2}
      fill="none"
      className={`connection-${connection.type}`}
    />
  );
}
