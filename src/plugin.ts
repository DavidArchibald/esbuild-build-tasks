import type { Plugin } from "esbuild";
import chalk from "chalk";
import prettyHrtime from "pretty-hrtime";

import type { Task } from "./task";

type Log = "none" | "log-tasks" | "log-all";

type Config = Partial<ResolvedConfig>;

// TODO: Deliver on per task configuration + series + parallel etc., relevant code is commented out.
type ResolvedConfig = {
	buildStart?: Task;
	buildEnd?: Task;

	/** How to log information about the build. `"none"` silences all logs, `"log-tasks"` means only the starting and stopping of tasks is logged, and `"log-all"` means the timing of the ESBuild is logged as well. Defaults to `log-all`. */
	log: Log;

	/** The number of seconds to wait for a graceful shutdown before killing a task completely. -1 means that the task may run indefinitely. Defaults to -1. Can also be configured at an individual task level. */
	// taskTimeout: number;

	/** The number of seconds to wait for a graceful shutdown before killing a task completely. -1 means that it will never force the task to terminate. 0 means that the task will be teminated instantly. Defaults to 30s. Can also be configured at an individual task level. */
	// taskTerminateTimeout: number;
};

export const tasksPlugin = (config: Config) => {
	// const { log, taskTimeout, taskTerminateTimeout } = config;
	const resolvedConfig: ResolvedConfig = {
		...config,
		log: config.log ?? "log-all",
		// taskTimeout: taskTimeout ?? -1,
		// taskTerminateTimeout: taskTerminateTimeout ?? 30,
	};

	const plugin: Plugin = {
		name: "esbuild-tasks-plugin",
		setup(build) {
			build.onStart(async () => {
				if (resolvedConfig.log === "log-all") {
					taskStarted("ESBuild");
				}

				await runTask(resolvedConfig, resolvedConfig.buildStart);
			});

			build.onEnd(async (result) => {
				if (resolvedConfig.log === "log-all") {
					if (result.errors.length === 0) {
						taskFinished("ESBuild");
					} else {
						taskFailed("ESBuild");
					}
				}

				await runTask(resolvedConfig, resolvedConfig.buildEnd);
			});
		},
	};

	return plugin;
};

// TODO: deduplicate tasks.

type HRTime = [number, number];

const taskTimes: Record<string, HRTime> = {};

function taskStarted(taskName: string) {
	taskTimes[taskName] = process.hrtime();

	// eslint-disable-next-line no-console
	console.log(chalk.yellow(`[${taskName}]`), "Starting...");
}

function taskFinished(taskName: string) {
	const durationStr = getDuration(taskName);

	// eslint-disable-next-line no-console
	console.log(chalk.green(`[${taskName}]`), "Finished after", chalk.magenta(durationStr));
}

function taskFailed(taskName: string) {
	const durationStr = getDuration(taskName);

	// eslint-disable-next-line no-console
	console.log(chalk.red(`[${taskName}]`), "Failed after", chalk.magenta(durationStr));
}

function getDuration(taskName: string) {
	const startTime = taskTimes[taskName];
	delete taskTimes[taskName];

	const durationStr = prettyHrtime(process.hrtime(startTime));

	return durationStr;
}

// TODO: Allow cancellation.
async function runTask(config: ResolvedConfig, task?: Task) {
	if (typeof task === "undefined") {
		return;
	}

	if (config.log === "log-all" || config.log === "log-tasks") {
		taskStarted(task.name);
	}

	const taskResult = await task.run();

	if (config.log === "log-all" || config.log === "log-tasks") {
		if (taskResult.type === "success") {
			taskFinished(task.name);
		} else if (taskResult.type === "failure") {
			taskFailed(task.name);
		}
	}
}
