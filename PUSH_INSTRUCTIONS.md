# Instrukcja: Push do GitHub z Personal Access Token

## Krok 1: Utwórz Personal Access Token

1. Przejdź do: https://github.com/settings/tokens
2. Kliknij **"Generate new token (classic)"**
3. Wypełnij formularz:
   - **Note**: `slab-market-push`
   - **Expiration**: Wybierz okres (np. 90 days lub No expiration)
   - **Select scopes**: Zaznacz `repo` (wszystkie uprawnienia)
4. Kliknij **"Generate token"**
5. **SKOPIUJ TOKEN** - pokazuje się tylko raz!

## Krok 2: Wykonaj push

Po utworzeniu tokena, uruchom w terminalu:

```bash
git remote add origin https://github.com/slabmarketeu/slabmarket.git
git branch -M main
git push -u origin main
```

Gdy zostaniesz poproszony o:
- **Username**: `slabmarketeu`
- **Password**: **Wklej token** (nie hasło do GitHub!)

## Alternatywa: Użyj tokena bezpośrednio w URL

```bash
git remote set-url origin https://TOKEN@github.com/slabmarketeu/slabmarket.git
git push -u origin main
```

Zastąp `TOKEN` swoim Personal Access Token.

## Alternatywa 2: SSH Key (bardziej bezpieczne)

Jeśli wolisz użyć SSH:

1. Wygeneruj klucz SSH:
```bash
ssh-keygen -t ed25519 -C "slabmarketeu@gmail.com"
```

2. Skopiuj klucz publiczny:
```bash
cat ~/.ssh/id_ed25519.pub
```

3. Dodaj klucz do GitHub:
   - Przejdź do: https://github.com/settings/keys
   - Kliknij "New SSH key"
   - Wklej klucz publiczny

4. Zmień remote na SSH:
```bash
git remote set-url origin git@github.com:slabmarketeu/slabmarket.git
git push -u origin main
```

## Troubleshooting

### Błąd: "Repository not found"
- Sprawdź, czy repozytorium istnieje: https://github.com/slabmarketeu/slabmarket
- Sprawdź, czy jesteś zalogowany na GitHub
- Sprawdź, czy masz uprawnienia do repozytorium

### Błąd: "Authentication failed"
- Upewnij się, że używasz tokena, a nie hasła
- Sprawdź, czy token ma uprawnienia `repo`
- Sprawdź, czy token nie wygasł

### Błąd: "Permission denied"
- Sprawdź, czy token ma uprawnienia `repo`
- Sprawdź, czy jesteś właścicielem repozytorium

