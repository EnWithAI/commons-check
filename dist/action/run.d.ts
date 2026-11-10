/** Environment and output seams for tests. */
export interface ActionIO {
    env: Record<string, string | undefined>;
    log: (text: string) => void;
    now?: () => Date;
}
/** Runs the action; returns the process exit code. */
export declare function runAction(io: ActionIO): Promise<number>;
