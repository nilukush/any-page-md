#!/usr/bin/env node
import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import { spawn } from "child_process";

const API_URL = "https://pagemd-4gyfjypgq-nilukushs-projects.vercel.app/api/convert";

const program = new Command();

program
  .name("pagemd")
  .description("Convert any webpage to clean Markdown")
  .version("0.1.0");

program
  .argument("<url>", "The URL of the webpage to convert")
  .option("-o, --output <file>", "Save output to file instead of stdout")
  .option("-j, --json", "Output as JSON (includes metadata)")
  .option("-r, --raw", "Output raw HTML before processing")
  .option("--api-url <url>", "Use custom API URL", API_URL)
  .action(async (url: string, options) => {
    const spinner = ora("Fetching webpage...").start();

    try {
      // Validate URL
      try {
        new URL(url);
      } catch {
        spinner.fail(chalk.red("Invalid URL provided"));
        process.exit(1);
      }

      // Call API
      const response = await fetch(options.apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        const error = await response.json();
        spinner.fail(chalk.red(`Error: ${error.details || error.error || "Failed to fetch"}`));
        process.exit(1);
      }

      const data = await response.json();

      spinner.succeed(chalk.green("Successfully converted to Markdown"));

      // Format title if available
      if (data.meta?.title) {
        console.log(chalk.bold(`\n# ${data.meta.title}\n`));
      }

      // Output based on options
      if (options.json) {
        console.log(JSON.stringify(data, null, 2));
      } else if (options.output) {
        // Write to file
        const fs = await import("fs");
        fs.writeFileSync(options.output, data.markdown);
        console.log(chalk.dim(`\nSaved to: ${options.output}`));
      } else {
        // Output to stdout
        console.log(data.markdown);

        // Show metadata info
        if (data.meta) {
          console.log(chalk.dim("\n---"));
          console.log(chalk.dim(`Word count: ${data.meta.wordCount}`));
          console.log(chalk.dim(`Source: ${data.meta.url}`));
          if (data.meta.excerpt) {
            console.log(chalk.dim(`Excerpt: ${data.meta.excerpt.substring(0, 100)}...`));
          }
        }
      }
    } catch (error) {
      spinner.fail(chalk.red(`Error: ${error instanceof Error ? error.message : "Unknown error"}`));
      process.exit(1);
    }
  });

// Add a 'ping' command to check API status
program
  .command("ping")
  .description("Check if the PageMD API is reachable")
  .option("--api-url <url>", "Use custom API URL", API_URL)
  .action(async (options) => {
    const spinner = ora("Checking API status...").start();

    try {
      const response = await fetch(options.apiUrl.replace("/api/convert", "/api/health"));

      if (response.ok) {
        const data = await response.json();
        spinner.succeed(chalk.green(`API is online: ${data.message || "OK"}`));
      } else {
        spinner.fail(chalk.red("API is not responding correctly"));
        process.exit(1);
      }
    } catch (error) {
      spinner.fail(chalk.red("Cannot reach API"));
      process.exit(1);
    }
  });

// Add a 'dev' command to run local development server
program
  .command("dev")
  .description("Start local development server")
  .action(async () => {
    console.log(chalk.blue("Starting development server..."));
    const child = spawn("npm", ["run", "dev"], {
      stdio: "inherit",
      shell: true,
    });
    child.on("error", (error) => {
      console.error(chalk.red("Failed to start dev server"));
      process.exit(1);
    });
    child.on("exit", (code) => {
      process.exit(code ?? 0);
    });
  });

program.parse();
