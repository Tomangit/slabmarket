# Szybki przewodnik: Push do GitHub

## Metoda 1: Windows Credential Manager (Najłatwiejsza)

1. **Utwórz Personal Access Token na GitHub:**
   - Przejdź do: https://github.com/settings/tokens
   - Kliknij: **Generate new token (classic)**
   - Nazwa: `Slab Market Push`
   - Uprawnienia: ✅ **repo**, ✅ **workflow**
   - Kliknij: **Generate token**
   - **SKOPIUJ TOKEN** (będzie widoczny tylko raz!)

2. **Zrób push (token wkleisz w oknie logowania):**
   ```bash
   git push origin main
   ```
   - Gdy pojawi się okno logowania:
     - Username: `slabmarketeu`
     - Password: **wklej swój token** (nie hasło GitHub!)
   - Windows zapamięta token w Credential Manager

## Metoda 2: Token w URL (Jednorazowe użycie)

1. **Utwórz token** (jak w Metodzie 1)

2. **Zaktualizuj remote URL z tokenem:**
   ```bash
   git remote set-url origin https://YOUR_TOKEN@github.com/slabmarketeu/slabmarket.git
   ```
   (Zamień `YOUR_TOKEN` na swój token)

3. **Zrób push:**
   ```bash
   git push origin main
   ```

4. **Usuń token z URL (dla bezpieczeństwa):**
   ```bash
   git remote set-url origin https://github.com/slabmarketeu/slabmarket.git
   ```

## Metoda 3: GitHub CLI (Jeśli zainstalowane)

1. **Zainstaluj GitHub CLI:**
   - Pobierz z: https://cli.github.com/
   - Lub użyj: `winget install GitHub.cli`

2. **Zaloguj się:**
   ```bash
   gh auth login
   ```
   - Wybierz: GitHub.com
   - Wybierz: HTTPS
   - Zaloguj się przez przeglądarkę

3. **Zrób push:**
   ```bash
   git push origin main
   ```

## Twój token powinien wyglądać tak:
```
ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## Co zrobić teraz?

1. Utwórz token na GitHub: https://github.com/settings/tokens
2. Wybierz metodę powyżej
3. Zrób push: `git push origin main`

