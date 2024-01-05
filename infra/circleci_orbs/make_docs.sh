#!/bin/bash

set -e

README="README.md"
overview="# *company-data-covered* CircleCI Orbs
This directory contains private orbs that *company-data-covered* maintains.

"

capitalize() (
  printf '%s' "$1" | head -c 1 | tr '[:lower:]' '[:upper:]'
  printf '%s' "$1" | tail -c '+2'
)

print_parameters() (
  job_or_command=$1
  job_or_command_name=$2
  orb_file=$3

  key=".$job_or_command.$job_or_command_name.parameters"
  echo "##### Parameters" >> $README
  parameters=$(yq "$key" "$orb_file")
  if [[ "$parameters" != "null" ]]; then
    {
      echo "| PARAMETER | DESCRIPTION | REQUIRED | DEFAULT | TYPE |"
      echo "| :-------- | :---------- | :------: | :-----: | :--: |"
    } >> $README

    IFS=, read -ra params <<< "$(yq "$key | keys" -o c "$orb_file")"
    for param in "${params[@]}"; do
      description=$(yq "$key.$param.description" "$orb_file")
      type=$(yq "$key.$param.type" "$orb_file")
      default=\`$(yq "$key.$param.default" "$orb_file")\`
      required="no"
      if [ "$default" == \`null\` ]; then
        default="-"
        required="yes"
      fi
      if [ "$default" == "\`\`" ]; then
        default="-"
      fi
      echo "| \`$param\` | $description | $required | $default | $type |" >> $README
    done < <(yq "$key | keys" -o c "$orb_file")
  else
    echo "None" >> $README
  fi
  echo >> $README
)

print_examples() (
  job_or_command=$1
  job_or_command_name=$2
  orb_file=$3
  {
    echo "##### Example Usage"
    yq ".$job_or_command.$job_or_command_name" "$orb_file" | grep "#" | sed -r 's/# ?//g'
  } >> $README
)

print_commands() (
  echo "### Commands" >> $README
  for cmd in $(yq '.commands | .[] | key' "$1"); do
    {
      echo "#### \`$cmd\`"
      yq ".commands.$cmd.description" "$1"
    } >> $README

    print_parameters "commands" "$cmd" "$1"
    print_examples "commands" "$cmd" "$1"
  done
)

print_jobs() (
  echo "### Jobs" >> $README
  for job in $(yq '.jobs | .[] | key' "$1"); do
    {
      echo "#### \`$job\`"
      yq ".jobs.$job.description" "$1"
    } >> $README

    print_parameters "jobs" "$job" "$1"
    print_examples "jobs" "$job" "$1"
  done
)

print_toc() (
  toc=$(grep '^#[# ]\? [^D]' $README | sed 's/##/  -/g' | sed 's/#/-/g')
  echo "$toc"
)

create_readme_link() (
  echo "#$1" | tr '[:upper:]' '[:lower:]' | sed s/'^ '//g | sed s/' '/-/g
)

print_contexts() (
  if ! circleci version > /dev/null; then
    echo "circleci cli must be installed and configured"
    exit 1
  fi

  IFS=',' read -r -a contexts <<< "$(circleci context list github *company-data-covered* | awk 'NF NR>3 { print $6 }' | tr '\n' ',')"
  printf "### Available Contexts\n" >> $README
  for context in "${contexts[@]}"; do
    echo "- \`$context\`" >> $README
    output=$(circleci context show github *company-data-covered* "$context")
    cut=$(echo "$output" | awk 'NF NR>3 { print $2 }' | tail -n +2 | tr '\n' ',')
    IFS=',' read -r -a vars <<< "$cut"
    for var in "${vars[@]}"; do
      echo "  - \`$var\`" >> $README
    done
  done
)

main() (
  # Create readme
  rm $README || true
  touch $README
  echo "<!-- WARNING: This document is automatically created using the make_docs.sh script and should not be directly edited -->" >> $README
  for file in ./docs/*; do
    cat "$file" >> "$README"
    if [[ "$file" == *contexts* ]]; then
      print_contexts
    fi
    echo >> "$README"
  done

  # Add available orbs to readme
  printf "# Available Orbs\n---\n" >> $README
  for file in ./*.yml; do
    orb_name=$(capitalize "$(basename "$file" .yml)")
    {
      echo "## $orb_name"
      yq '.description' "$file"
      echo
    } >> $README

    print_commands "$file"
    print_jobs "$file"
    echo "---" >> $README
  done

  # Add overview and table of contents to readme
  toc=$overview
  while IFS= read -r section; do
    stripped=$(echo "$section" | sed s/'## '//g | sed s/'# '//g)
    link=$(create_readme_link "$stripped")

    if [[ "$section" =~ ^'# '.* ]]; then
      replace="-"
    elif [[ "$section" =~ ^'## '.* ]]; then
      replace="  -"
    fi

    toc+="$replace [$stripped]($link)\n"
  done < <(grep '^#[# ]\? ' $README)

  echo -e "$toc\n$(cat $README)" > $README
)

main