import tmp from 'tmp';
import { run, isManifestGenerator } from './index';
import { createWriteStream, existsSync } from 'fs';
import shellescape from 'shell-escape';
import { register } from 'ts-node';
import path from 'path';

const registerOnce = (() => {
  let registered = false;
  return () => {
    if (!registered) {
      register({
        transpileOnly: true
      });
    }
    registered = true;
  };
})();

function mapOptionValues(
  args: string[],
  optionNames: string[],
  callback: (arg: string) => string
): string[] {
  let insideOption = false;
  const optionNameSet: Record<string, boolean> = optionNames.reduce(
    (state, optionName) => {
      state[optionName] = true;
      return state;
    },
    {} as Record<string, boolean>
  );
  return args.map((arg) => {
    if (arg[0] === '-') {
      insideOption = optionNameSet[arg];
      return arg;
    } else {
      return insideOption ? callback(arg) : arg;
    }
  });
}

function evaluate(filename: string): string {
  if (!(filename.endsWith('.ts') || filename.endsWith('.js'))) {
    return filename;
  }

  filename = path.isAbsolute(filename)
    ? filename
    : path.join(process.cwd(), filename);

  if (!existsSync(filename)) {
    throw new Error(`${filename} does not exist`);
  }

  registerOnce();

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const module = require(filename);

  if (isManifestGenerator(module)) {
    const tempfile = tmp.fileSync();

    run(filename, module, createWriteStream(tempfile.name));

    return tempfile.name;
  } else {
    throw new Error(`${filename} does not export generate()`);
  }
}

function cli() {
  try {
    process.stdout.write(
      shellescape(
        mapOptionValues(process.argv.slice(2), ['-f', '--filename'], evaluate)
      )
    );
  } catch (err) {
    process.stderr.write(`${err}\n`);
    process.exit(1);
  }
}

cli();
