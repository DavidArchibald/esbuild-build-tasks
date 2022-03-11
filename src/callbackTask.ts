import { buildRunException, buildRunSuccess, type RunResult, Task } from "./task";

export class CallbackTask extends Task {
	constructor(name: string, private callback: () => RunResult | undefined | Promise<RunResult | undefined>) {
		super(name);
	}

	async run(): Promise<RunResult> {
		let runResult: RunResult | undefined;
		try {
			runResult = await this.callback();
		} catch (e) {
			return buildRunException(e);
		}

		if (typeof runResult === "undefined") {
			return buildRunSuccess();
		}

		return runResult;
	}
}
