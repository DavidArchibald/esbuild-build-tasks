export type RunOptions = {
	parallel: boolean;
};

export type RunResult = RunSuccess | RunFailure | RunException | RunCancelled;

export type RunSuccess = Readonly<{
	type: "success";
}>;

export type RunFailure = Readonly<{
	type: "failure";
	errorMessage: string;
}>;

export type RunException = Readonly<{
	type: "exception";
	error: unknown;
}>;

export type RunCancelled = Readonly<{
	type: "cancelled";
}>;

export function buildRunSuccess(): RunSuccess {
	return {
		type: "success",
	};
}

export function buildRunFailure(errorMessage: string): RunFailure {
	return {
		type: "failure",
		errorMessage,
	};
}

export function buildRunException(error: unknown): RunException {
	return {
		type: "exception",
		error,
	};
}

export function buildRunCancelled(): RunCancelled {
	return {
		type: "cancelled",
	};
}

export type StopOptions = {
	stopTimeout: number;
};

export abstract class Task {
	static taskType: string;

	constructor(public name: string) {}

	abstract run(): Promise<RunResult>;
}

export abstract class StoppableTask extends Task {
	abstract stop(): Promise<void>;
}
