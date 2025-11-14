# Instrukcja: Push do GitHub

## Krok 1: Utwórz repozytorium na GitHub

1. Przejdź do: https://github.com/new
2. Wypełnij formularz:
   - **Repository name**: `slab-market` (lub inna nazwa)
   - **Description**: "Slab Market - Marketplace for graded Pokemon cards"
   - **Visibility**: Public lub Private (według preferencji)
   - **NIE zaznaczaj**:
     - ❌ Add a README file
     - ❌ Add .gitignore
     - ❌ Choose a license
3. Kliknij **"Create repository"**

## Krok 2: Dodaj remote i zrób push

Po utworzeniu repozytorium, GitHub pokaże Ci instrukcje. Wykonaj następujące polecenia:

```bash
# Dodaj remote (zastąp USERNAME i REPO_NAME swoimi danymi)
git remote add origin https://github.com/slabmarketeu/slab-market.git

# Zmień branch na main (opcjonalnie, jeśli GitHub używa main zamiast master)
git branch -M main

# Zrób push
git push -u origin main
```

Lub jeśli używasz SSH:

```bash
git remote add origin git@github.com:slabmarketeu/slab-market.git
git branch -M main
git push -u origin main
```

## Krok 3: Weryfikacja

Po push, sprawdź:
- Przejdź do: https://github.com/slabmarketeu/slab-market
- Powinieneś zobaczyć wszystkie pliki projektu
- Commit history powinien pokazywać 2 commity:
  - `feat: add Sentry monitoring and CI/CD pipeline`
  - `chore: add .env to .gitignore`

## Uwagi

- Jeśli masz problemy z autentykacją, możesz użyć GitHub CLI lub Personal Access Token
- Plik `.env` nie będzie w repozytorium (jest w .gitignore)
- Po pierwszym push, GitHub Actions automatycznie uruchomią testy (jeśli skonfigurowałeś secrets)

## Troubleshooting

### Błąd: "remote origin already exists"
```bash
git remote remove origin
git remote add origin https://github.com/slabmarketeu/slab-market.git
```

### Błąd: "authentication failed"
Użyj Personal Access Token zamiast hasła:
1. Przejdź do: https://github.com/settings/tokens
2. Utwórz nowy token z uprawnieniami `repo`
3. Użyj tokenu jako hasła przy push

### Błąd: "branch main does not exist"
Jeśli używasz brancha `master`:
```bash
git push -u origin master
```

