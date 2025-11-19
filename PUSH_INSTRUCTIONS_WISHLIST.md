# Instrukcja: Jak zrobić push do GitHub

## Krok 1: Utworzenie Personal Access Token (PAT) na GitHub

1. Przejdź do GitHub.com i zaloguj się
2. Kliknij na swoje zdjęcie profilowe (prawy górny róg)
3. Wybierz **Settings**
4. W menu po lewej stronie, na dole znajdź **Developer settings**
5. Kliknij **Personal access tokens** → **Tokens (classic)**
6. Kliknij **Generate new token** → **Generate new token (classic)**
7. Nadaj nazwę tokenowi (np. "Slab Market Push")
8. Wybierz zakresy uprawnień (scopes):
   - ✅ **repo** (pełny dostęp do repozytoriów)
   - ✅ **workflow** (dostęp do GitHub Actions)
9. Kliknij **Generate token**
10. **WAŻNE**: Skopiuj token natychmiast (będzie widoczny tylko raz!)
   - Format: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

## Krok 2: Zaktualizowanie remote URL z tokenem

### Opcja A: Użycie tokenu w URL (bezpieczne dla jednorazowego użycia)

```bash
# Zamień YOUR_TOKEN na swój token
git remote set-url origin https://YOUR_TOKEN@github.com/slabmarketeu/slabmarket.git
```

### Opcja B: Użycie GitHub CLI (jeśli zainstalowane)

```bash
gh auth login
```

### Opcja C: Użycie Windows Credential Manager (automatyczne)

```bash
# Push z monitem o hasło (wklej token jako hasło)
git push origin main
# Użytkownik: slabmarketeu
# Hasło: [wklej swój token]
```

## Krok 3: Wykonanie push

```bash
git push origin main
```

## Krok 4: Weryfikacja

Sprawdź na GitHub.com, czy commity zostały wypchnięte:
- Przejdź do: https://github.com/slabmarketeu/slabmarket
- Sprawdź commity na branchu `main`

## Bezpieczeństwo

⚠️ **NIE COMMITUJ tokenu do repozytorium!**
- Token powinien być przechowywany tylko lokalnie
- Możesz użyć Windows Credential Manager, który zapisze token bezpiecznie
- Jeśli przypadkowo wkleisz token do URL, usuń go z historii Git:
  ```bash
  git remote set-url origin https://github.com/slabmarketeu/slabmarket.git
  ```

## Alternatywa: SSH (bardziej bezpieczne)

Jeśli chcesz użyć SSH zamiast HTTPS:

1. Wygeneruj klucz SSH:
   ```bash
   ssh-keygen -t ed25519 -C "your_email@example.com"
   ```

2. Dodaj klucz publiczny do GitHub:
   - Settings → SSH and GPG keys → New SSH key
   - Wklej zawartość pliku `~/.ssh/id_ed25519.pub`

3. Zmień remote URL:
   ```bash
   git remote set-url origin git@github.com:slabmarketeu/slabmarket.git
   ```

4. Push:
   ```bash
   git push origin main
   ```

## Troubleshooting

### Problem: "remote: Repository not found"
- Sprawdź, czy token ma uprawnienia `repo`
- Sprawdź, czy nazwa repozytorium jest poprawna
- Sprawdź, czy masz dostęp do repozytorium

### Problem: "Permission denied"
- Sprawdź, czy token nie wygasł
- Sprawdź, czy token ma odpowiednie uprawnienia
- Spróbuj wygenerować nowy token

### Problem: "Authentication failed"
- Upewnij się, że używasz tokenu, a nie hasła
- Sprawdź, czy token nie został odwołany
- Spróbuj użyć GitHub CLI: `gh auth login`

