
#!/bin/bash

set -e

if [[ -n $(git status --porcelain) ]]; then

  echo "Tienes cambios locales sin guardar. Haz commit o stash antes de continuar."

  exit 1

fi

git switch main

git pull origin main

git merge beta

git push origin main

echo "Cambios de beta llevados a main correctamente."

