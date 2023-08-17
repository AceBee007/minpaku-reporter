# Minpaku reporter
A tool to automate minpaku report
## How to use
### prerequisite
What you need
- `pyenv`
- `poetry`
- `python (version should be 3.11 or newer)`

Run below to get latest chromium webdriver, and install the dependency

```bash
$ ./webdrivers/download_latest_webdriver.sh
$ poetry install --without dev
```
### Run report script
Run below to execute the automatic report script

```bash
$ ./run.sh
```
