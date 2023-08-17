# Minpaku reporter
A tool to automate minpaku report

## How to use
### prerequisite
What you need
- `pyenv`
- `poetry`
- `python (version should be 3.11 or newer)`

Run below to get latest chromium webdriver

```bash
./webdrivers/download_latest_webdriver.sh
```

Install the dependency

```bash
poetry install --without dev
```

Copy the `.env.sample` to `.env` and change the credentials/settings

```bash
cp .env.sample .env
```

### Run report script
Run below to execute the automatic report script

```bash
$ ./run.sh
```
