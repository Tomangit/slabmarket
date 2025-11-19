// Supabase Edge Function: Verify Certificate
// Stub implementation for PSA, BGS, CGC certificate verification

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-dev-bypass-auth",
};

interface VerifyRequest {
  grading_company: string;
  certificate_number: string;
  grade?: string;
}

interface VerifyResponse {
  verified: boolean;
  valid: boolean;
  data?: {
    certificate_number: string;
    grade: string;
    grading_company?: string;
    card_name?: string;
    set_name?: string;
    card_number?: string;
    year?: number;
    set_slug?: string;
    image_url?: string;
    grading_date?: string;
    pop_report?: {
      grade: string;
      population: number;
    };
  };
  error?: string;
}

// PSA HTML scrape helper
/**
 * Czyści URL obrazu - usuwa parametry przycinające i zamienia miniaturki na pełny obraz
 * @param imageUrl URL obrazu do wyczyszczenia
 * @param certNumber Numer certyfikatu (do logowania)
 * @returns Wyczyszczony URL z pełnym obrazem
 */
function cleanImageUrl(imageUrl: string, certNumber: string): string {
  if (!imageUrl) return imageUrl;
  
  let cleanedUrl = imageUrl;
  
  console.log(`[cleanImageUrl] Original URL for cert ${certNumber}: ${cleanedUrl}`);
  
  // 1. Usuń parametry przycinające z query string (w=, h=, width=, height=, size=, crop=)
  try {
    const url = new URL(cleanedUrl);
    const paramsToRemove = ['w', 'h', 'width', 'height', 'size', 'crop', 'fit', 'resize', 'scale'];
    
    paramsToRemove.forEach(param => {
      if (url.searchParams.has(param)) {
        url.searchParams.delete(param);
      }
    });
    
    cleanedUrl = url.toString();
    console.log(`[cleanImageUrl] After removing crop params: ${cleanedUrl}`);
  } catch (e) {
    // Jeśli URL.parse nie działa, użyj regex
    cleanedUrl = cleanedUrl.replace(/(\?|&)(w|h|width|height|size|crop|fit|resize|scale)=[^&]*/gi, '');
    // Usuń trailing & po usunięciu parametrów
    cleanedUrl = cleanedUrl.replace(/\?&/, '?').replace(/\?$/, '');
    cleanedUrl = cleanedUrl.replace(/&$/, '');
    console.log(`[cleanImageUrl] After regex crop param removal: ${cleanedUrl}`);
  }
  
  // 2. Zamień /small/, /thumb/, /thumbnail/, /medium/ na pełny obraz (usuń te foldery)
  // Przykład: /cert/125866845/small/image.jpg -> /cert/125866845/image.jpg
  const sizeFolders = ['/small/', '/thumb/', '/thumbnail/', '/medium/', '/tiny/', '/mini/'];
  sizeFolders.forEach(folder => {
    if (cleanedUrl.includes(folder)) {
      cleanedUrl = cleanedUrl.replace(folder, '/');
      console.log(`[cleanImageUrl] Replaced ${folder} with /: ${cleanedUrl}`);
    }
  });
  
  // 3. Dla CloudFront: jeśli jest /small/ lub podobne, spróbuj zamienić na /large/ lub po prostu usuń
  // Przykład CloudFront: d1htnxwo4o0jhw.cloudfront.net/cert/186364651/small/Y72p9T26qUGw0HNn_XHvfA_dac2e.jpg
  // -> d1htnxwo4o0jhw.cloudfront.net/cert/186364651/large/Y72p9T26qUGw0HNn_XHvfA_dac2e.jpg
  // LUB -> d1htnxwo4o0jhw.cloudfront.net/cert/186364651/Y72p9T26qUGw0HNn_XHvfA_dac2e.jpg
  if (cleanedUrl.includes('cloudfront.net')) {
    // Spróbuj najpierw zamienić na /large/
    if (cleanedUrl.match(/\/cert\/\d+\/(small|thumb|thumbnail|medium)\//i)) {
      cleanedUrl = cleanedUrl.replace(/\/(small|thumb|thumbnail|medium)\//i, '/large/');
      console.log(`[cleanImageUrl] CloudFront: replaced size folder with /large/: ${cleanedUrl}`);
    }
    
    // Jeśli nadal jest /small/ lub podobne, po prostu usuń (może być pełny obraz bez folderu)
    sizeFolders.forEach(folder => {
      if (cleanedUrl.includes(folder)) {
        cleanedUrl = cleanedUrl.replace(folder, '/');
        console.log(`[cleanImageUrl] CloudFront: removed ${folder}: ${cleanedUrl}`);
      }
    });
  }
  
  // 4. Dla PSA: podobnie usuń foldery z rozmiarem
  if (cleanedUrl.includes('psacard.com') || cleanedUrl.includes('images.psacard.com')) {
    sizeFolders.forEach(folder => {
      if (cleanedUrl.includes(folder)) {
        cleanedUrl = cleanedUrl.replace(folder, '/');
        console.log(`[cleanImageUrl] PSA: removed ${folder}: ${cleanedUrl}`);
      }
    });
  }
  
  console.log(`[cleanImageUrl] Final cleaned URL for cert ${certNumber}: ${cleanedUrl}`);
  return cleanedUrl;
}

async function fetchPsaCertificateData(certNumber: string): Promise<{
  ok: boolean;
  error?: string;
  data?: {
    card_name?: string;
    set_name?: string;
    card_number?: string;
    year?: number;
    grade?: string;
    image_url?: string;
  };
}> {
  try {
    const url = `https://www.psacard.com/cert/${encodeURIComponent(certNumber)}`;
    
    // Dodaj opóźnienie, żeby nie wyglądać jak bot
    await new Promise((resolve) => setTimeout(resolve, 500 + Math.random() * 1000));
    
    // Bardziej realistyczne headers, które imitują prawdziwą przeglądarkę
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "DNT": "1",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-User": "?1",
        "Cache-Control": "max-age=0",
        "Referer": "https://www.psacard.com/",
      },
      redirect: "follow",
    });

    if (!res.ok) {
      console.error(`[fetchPsaCertificateData] PSA responded with status ${res.status} for cert ${certNumber}`);
      // Jeśli 403, PSA blokuje scrapera - zwróć bardziej szczegółowy błąd
      if (res.status === 403) {
        return { 
          ok: false, 
          error: "PSA is blocking automated requests. Please verify the certificate manually or try again later." 
        };
      }
      return { ok: false, error: `PSA responded with status ${res.status}` };
    }

    const html = await res.text();

    // Szybkie wykrycie stron blokady/captcha
    if (/captcha|Access Denied|temporarily unavailable/i.test(html)) {
      return { ok: false, error: "PSA blocked automated request (captcha/denied)" };
    }

    // Spróbuj użyć DOMParser, jeśli dostępny; w przeciwnym razie użyj regexów
    let doc: Document | null = null;
    try {
      // @ts-ignore DOMParser może nie być dostępny w środowisku
      if (typeof DOMParser !== "undefined") {
        // @ts-ignore
        doc = new DOMParser().parseFromString(html, "text/html");
      }
    } catch {
      doc = null;
    }

    let cardName: string | undefined;
    let setName: string | undefined;
    let cardNumber: string | undefined;
    let year: number | undefined;
    let grade: string | undefined;
    let imageUrl: string | undefined;

    // Heurystyki parsowania (layout PSA bywa zmienny)
    // 1) Tytuł strony lub nagłówki
    const title =
      doc?.querySelector("title")?.textContent?.trim() ??
      (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() ?? "");
    // Przykład: "PSA Cert #82749361 - 1999 Pokemon Game Pikachu 58/102 GEM MT 10"
    if (title) {
      const yearMatch = title.match(/(^|\s)((19|20)\d{2})(\s|$)/);
      if (yearMatch && yearMatch[2]) {
        const parsedYear = parseInt(yearMatch[2], 10);
        if (!isNaN(parsedYear) && parsedYear >= 1900 && parsedYear <= 2100) {
          year = parsedYear;
        }
      }
      // NIE parsujemy card_number z tytułu - może być mylące (np. "125" z cert number zamiast "146")
      // grade at end often like "GEM MT 10" or "10"
      const gradeMatch = title.match(/(\b(10|9|8|7|6|5|4|3|2|1)\b(?!\/))/);
      if (gradeMatch) grade = gradeMatch[1];
    }

    // 2) Szukamy w sekcji "Item Information" - bardziej precyzyjne parsowanie
    // PSA ma strukturę w HTML: <dt>Brand/Title</dt><dd>POKEMON SKYRIDGE</dd>
    // Lub w tekście: "Brand/Title  POKEMON SKYRIDGE" (bez dwukropka, tylko spacje)
    
    // Najpierw wyciągnijmy sekcję "Item Information" z HTML
    // Szukamy sekcji ograniczonej przez "Item Information" i "Set Registry" lub następną sekcję
    // NIE zatrzymuj się na pojedynczym </div> (może być wewnątrz sekcji), ale na "Set Registry" lub końcu sekcji
    // Używamy bardziej precyzyjnego regex, aby zbierać wszystkie pola w sekcji "Item Information"
    const itemInfoMatch = html.match(/Item Information[\s\S]*?(?=Set Registry|<h[1-6][^>]*>|Company About Us|©\s+\d{4}|<\/section[^>]*>)/i);
    let itemInfoText = null;
    let itemInfoHtml = null;
    
    if (itemInfoMatch) {
      itemInfoHtml = itemInfoMatch[0];
      
      // Ogranicz długość - jeśli jest za długa, prawdopodobnie zbieramy za dużo
      if (itemInfoHtml.length > 5000) {
        // Spróbuj bardziej agresywnego ograniczenia - tylko do "Set Registry" lub najbliższego nagłówka
        const limitedMatch = html.match(/Item Information[\s\S]{0,5000}?(?=Set Registry|<h[1-6][^>]*>|Company About Us|©\s+\d{4})/i);
        if (limitedMatch && limitedMatch[0].length < itemInfoHtml.length) {
          itemInfoHtml = limitedMatch[0];
          console.log(`[fetchPsaCertificateData] Limited Item Info HTML to ${itemInfoHtml.length} chars (was ${itemInfoMatch[0].length})`);
        }
      }
      
      // Jeśli HTML jest za krótki (mniej niż 500 znaków), prawdopodobnie zbieramy za mało
      // Spróbuj bardziej agresywnego regex, który zbiera więcej danych
      if (itemInfoHtml.length < 500) {
        console.log(`[fetchPsaCertificateData] WARNING: Item Info HTML seems too short (${itemInfoHtml.length} chars), trying broader match`);
        // Spróbuj zebrać więcej - do "Set Registry" lub następnego dużego nagłówka
        const broaderMatch = html.match(/Item Information[\s\S]*?(?=Set Registry|<h[2-3][^>]*>Set|<h[2-3][^>]*>Company|<h[2-3][^>]*>Sales|Company About Us)/i);
        if (broaderMatch && broaderMatch[0].length > itemInfoHtml.length) {
          itemInfoHtml = broaderMatch[0];
          console.log(`[fetchPsaCertificateData] Expanded Item Info HTML to ${itemInfoHtml.length} chars (was ${itemInfoMatch[0].length})`);
        }
      }
      
      // NIE obcinajmy tekstu przed parsowaniem HTML - najpierw wyciągnijmy wartości z HTML
      // (obcinanie może usunąć właściwe wartości, np. "Subject CHARIZARD-HOLO")
      // Tekst będzie używany tylko jako fallback, więc nie ma znaczenia, jeśli jest długi
      
      itemInfoText = itemInfoHtml
        .replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ");
      
      console.log(`[fetchPsaCertificateData] Item Info HTML length: ${itemInfoHtml.length}`);
      console.log(`[fetchPsaCertificateData] Item Info HTML preview: ${itemInfoHtml.substring(0, 1000) || "none"}`);
      console.log(`[fetchPsaCertificateData] Item Info Text length: ${itemInfoText?.length || 0}`);
      console.log(`[fetchPsaCertificateData] Item Info Text preview: ${itemInfoText?.substring(0, 500) || "none"}`);
    } else {
      console.log(`[fetchPsaCertificateData] Item Information section not found in HTML`);
    }

    // Spróbuj najpierw z HTML (struktura <dt>/<dd>)
    // Jeśli itemInfoHtml jest za krótki, szukaj bezpośrednio w całym HTML, nie tylko w itemInfoHtml
    const htmlToSearch = itemInfoHtml && itemInfoHtml.length >= 500 ? itemInfoHtml : html;
    
    console.log(`[fetchPsaCertificateData] Using HTML source: ${htmlToSearch === html ? 'full HTML' : 'itemInfoHtml'} (length: ${htmlToSearch.length})`);
    
    if (htmlToSearch) {
      // Najpierw sprawdźmy, czy w HTML są kluczowe pola
      const hasBrandTitle = htmlToSearch.includes('Brand/Title') || htmlToSearch.includes('Brand') || htmlToSearch.includes('POKEMON SKYRIDGE');
      const hasSubject = htmlToSearch.includes('Subject') || htmlToSearch.includes('CHARIZARD');
      const hasCardNumber = htmlToSearch.includes('Card Number');
      const hasYear = htmlToSearch.includes('Year') || htmlToSearch.includes('2003');
      
      console.log(`[fetchPsaCertificateData] HTML contains - Brand/Title: ${hasBrandTitle}, Subject: ${hasSubject}, Card Number: ${hasCardNumber}, Year: ${hasYear}`);
      // Brand/Title = Set Name (z HTML) - szukaj w różnych formatach
      if (!setName) {
        // Format 1: <dt>Brand/Title</dt><dd>POKEMON SKYRIDGE</dd>
        let brandMatch = htmlToSearch.match(/<dt[^>]*>Brand\/Title<\/dt>\s*<dd[^>]*>([^<]+)<\/dd>/i);
        if (!brandMatch) {
          // Format 1b: <dt class="...">Brand/Title</dt><dd class="...">POKEMON SKYRIDGE</dd>
          brandMatch = htmlToSearch.match(/<dt[^>]*class[^>]*>Brand\/Title<\/dt>[\s\S]*?<dd[^>]*>([^<]+)<\/dd>/i);
        }
        if (!brandMatch) {
          // Format 2: Brand/Title: POKEMON SKYRIDGE (w linii) - bardziej elastyczny
          brandMatch = htmlToSearch.match(/Brand\/Title[^>]*>([A-Z][A-Z0-9\s\-]+?)(?:<|Subject|Card Number|Category)/i);
        }
        if (!brandMatch) {
          // Format 3: Brand/Title w zwykłym tekście HTML - bardziej elastyczny
          brandMatch = htmlToSearch.match(/Brand\/Title[\s:>]+([A-Z][A-Z0-9\s\-]+?)(?:Subject|Card Number|Category|<\/dd>|<\/dt>)/i);
        }
        if (!brandMatch) {
          // Format 4: Spróbuj znaleźć po prostu między Brand/Title a Subject
          const brandSubjectSection = htmlToSearch.match(/Brand\/Title[\s\S]{0,200}?Subject/i);
          if (brandSubjectSection) {
            brandMatch = brandSubjectSection[0].match(/>([A-Z][A-Z0-9\s\-]{3,50}?)(?:\s*<|Subject)/i);
          }
        }
        if (brandMatch) {
          const extracted = brandMatch[1].trim()
            .replace(/&amp;/g, "&")
            .replace(/&nbsp;/g, " ")
            .replace(/&[a-z]+;/gi, " ")
            .replace(/\s+/g, " ");
          // Walidacja - tylko wielkie litery i cyfry
          if (extracted.length > 0 && extracted.length <= 100 && /^[A-Z0-9\s\-&]+$/i.test(extracted)) {
            setName = extracted.substring(0, 100);
            console.log(`[fetchPsaCertificateData] Found set_name from HTML (Format ${brandMatch[0].includes('<dt>') ? '1' : brandMatch[0].includes('>') ? '2' : '3'}, source: ${htmlToSearch === html ? 'full HTML' : 'itemInfoHtml'}): "${setName}"`);
          } else {
            console.log(`[fetchPsaCertificateData] Rejected set_name (invalid format): "${extracted.substring(0, 50)}..."`);
          }
        } else {
          console.log(`[fetchPsaCertificateData] Brand/Title not found in HTML. Preview around "Brand": ${htmlToSearch.substring(Math.max(0, htmlToSearch.indexOf('Brand') - 100), Math.min(htmlToSearch.length, htmlToSearch.indexOf('Brand') + 300))}`);
        }
      }
      
      // Subject = Card Name (z HTML) - szukaj w różnych formatach
      if (!cardName) {
        // Format 1: <dt>Subject</dt><dd>CHARIZARD-HOLO</dd>
        let subjectMatch = htmlToSearch.match(/<dt[^>]*>Subject<\/dt>\s*<dd[^>]*>([^<]+)<\/dd>/i);
        if (!subjectMatch) {
          // Format 2: Subject: CHARIZARD-HOLO (w linii)
          subjectMatch = htmlToSearch.match(/Subject[^>]*>([A-Z][A-Z0-9\s\-]+?)(?:<|Card Number)/i);
        }
        if (!subjectMatch) {
          // Format 3: Subject w zwykłym tekście HTML
          subjectMatch = htmlToSearch.match(/Subject[\s:]+([A-Z][A-Z0-9\s\-]+?)(?:Card Number|Category|<\/)/i);
        }
        if (subjectMatch) {
          const extracted = subjectMatch[1].trim()
            .replace(/&amp;/g, "&")
            .replace(/&nbsp;/g, " ")
            .replace(/\s+/g, " ");
          cardName = extracted.substring(0, 100); // Ogranicz długość do 100 znaków
          console.log(`[fetchPsaCertificateData] Found card_name from HTML (Format ${subjectMatch[0].includes('<dt>') ? '1' : subjectMatch[0].includes('>') ? '2' : '3'}, source: ${htmlToSearch === html ? 'full HTML' : 'itemInfoHtml'}): "${cardName}"`);
        }
      }
      
      // Card Number (z HTML) - ważne: nie bierzemy Cert Number, tylko Card Number
      if (!cardNumber) {
        // Format 1: <dt>Card Number</dt><dd>146</dd>
        let cnMatch = htmlToSearch.match(/<dt[^>]*>Card Number<\/dt>\s*<dd[^>]*>([^<]+)<\/dd>/i);
        if (!cnMatch) {
          // Format 1b: <dt class="...">Card Number</dt><dd class="...">146</dd>
          cnMatch = htmlToSearch.match(/<dt[^>]*class[^>]*>Card Number<\/dt>[\s\S]*?<dd[^>]*>([^<]+)<\/dd>/i);
        }
        if (!cnMatch) {
          // Format 2: Card Number: 146 (w linii) - bardziej elastyczny
          cnMatch = htmlToSearch.match(/Card Number[^>]*>(\d{1,3}[a-zA-Z]?)(?:<|Category|<\/dd>)/i);
        }
        if (!cnMatch) {
          // Format 3: Card Number w zwykłym tekście HTML (NIE Cert Number!) - bardziej elastyczny
          cnMatch = htmlToSearch.match(/Card Number[\s:>]+(\d{1,3}[a-zA-Z]?)(?:Category|<\/dd>|<\/dt>|<\/)/i);
        }
        if (!cnMatch) {
          // Format 4: Spróbuj znaleźć po prostu między Card Number a Category
          const cardCategorySection = htmlToSearch.match(/Card Number[\s\S]{0,100}?Category/i);
          if (cardCategorySection) {
            cnMatch = cardCategorySection[0].match(/>(\d{1,3}[a-zA-Z]?)(?:\s*<|Category)/i);
          }
        }
        if (cnMatch) {
          const extracted = cnMatch[1].trim();
          // Walidacja - tylko cyfry (1-3) + opcjonalnie litera
          if (/^\d{1,3}[a-zA-Z]?$/.test(extracted) && !(extracted.length === 3 && parseInt(extracted) > 200)) {
            cardNumber = extracted;
            console.log(`[fetchPsaCertificateData] Found card_number from HTML (Format ${cnMatch[0].includes('<dt>') ? '1' : cnMatch[0].includes('>') ? '2' : '3'}, source: ${htmlToSearch === html ? 'full HTML' : 'itemInfoHtml'}): "${cardNumber}"`);
          } else {
            console.log(`[fetchPsaCertificateData] Rejected card_number (invalid format): "${extracted}"`);
          }
        } else {
          console.log(`[fetchPsaCertificateData] Card Number not found in HTML. Preview around "Card Number": ${htmlToSearch.substring(Math.max(0, htmlToSearch.indexOf('Card Number') - 100), Math.min(htmlToSearch.length, htmlToSearch.indexOf('Card Number') + 300))}`);
        }
      }
      
      // Year (z HTML) - szukaj w sekcji "Item Information"
      if (!year) {
        // Format 1: <dt>Year</dt><dd>2003</dd>
        let yearMatch = htmlToSearch.match(/<dt[^>]*>Year<\/dt>\s*<dd[^>]*>(\d{4})<\/dd>/i);
        if (!yearMatch) {
          // Format 2: Year: 2003 (w linii)
          yearMatch = htmlToSearch.match(/Year[^>]*>(\d{4})(?:<|Brand|Subject)/i);
        }
        if (!yearMatch) {
          // Format 3: Year w zwykłym tekście HTML
          yearMatch = htmlToSearch.match(/Year[\s:]+(\d{4})(?:Brand|Subject|Card Number|<\/)/i);
        }
        if (yearMatch) {
          const parsedYear = parseInt(yearMatch[1], 10);
          if (!isNaN(parsedYear) && parsedYear >= 1900 && parsedYear <= 2100) {
            year = parsedYear;
            console.log(`[fetchPsaCertificateData] Found year from HTML (source: ${htmlToSearch === html ? 'full HTML' : 'itemInfoHtml'}): "${year}"`);
          }
        }
      }
    }

    // Fallback: jeśli nie znaleźliśmy w HTML, spróbuj w tekście - bardziej precyzyjne
    // Używamy non-greedy match i precyzyjnych granic, aby nie zbierać całego tekstu
    if (itemInfoText) {
      // Brand/Title = Set Name (z tekstu) - bardzo precyzyjny regex
      // Szukamy: "Brand/Title" + spacje + TYLKO wielkie litery/cyfry/myślniki (max 50 znaków) + kończy się na "Subject" lub "Card Number"
      if (!setName) {
        // Najpierw spróbuj z bardziej precyzyjnym regex - tylko wielkie litery i cyfry, max 50 znaków
        let brandMatch = itemInfoText.match(/Brand\/Title\s+([A-Z0-9\s\-]{1,50}?)(?:\s+Subject|\s+Card Number|$)/i);
        if (!brandMatch) {
          // Fallback: szukaj między "Brand/Title" a "Subject"
          const beforeSubject = itemInfoText.split('Subject')[0];
          brandMatch = beforeSubject.match(/Brand\/Title\s+([A-Z0-9\s\-]+?)$/i);
        }
        if (brandMatch) {
          const extracted = brandMatch[1].trim().replace(/\s+/g, " ");
          // Ograniczenie: tylko jeśli nie zawiera małych liter (które nie powinny być w nazwie setu PSA)
          // i jest krótsze niż 50 znaków
          if (extracted.length > 0 && extracted.length <= 50 && /^[A-Z0-9\s\-]+$/.test(extracted)) {
            setName = extracted;
            console.log(`[fetchPsaCertificateData] Found set_name from text: "${setName}"`);
          } else {
            console.log(`[fetchPsaCertificateData] Rejected set_name (invalid: length=${extracted.length}, contains lowercase=${/[a-z]/.test(extracted)}): "${extracted.substring(0, 50)}..."`);
          }
        }
      }
      
      // Subject = Card Name (z tekstu) - bardzo precyzyjny regex
      // Szukamy: "Subject" + spacje + TYLKO wielkie litery/cyfry/myślniki (max 50 znaków) + kończy się na "Card Number" lub "Category"
      if (!cardName) {
        // Najpierw spróbuj z bardziej precyzyjnym regex - tylko wielkie litery i cyfry, max 50 znaków
        let subjectMatch = itemInfoText.match(/Subject\s+([A-Z0-9\s\-]{1,50}?)(?:\s+Card Number|\s+Category|$)/i);
        if (!subjectMatch) {
          // Fallback: szukaj między "Subject" a "Card Number"
          const beforeCardNumber = itemInfoText.split('Card Number')[0];
          subjectMatch = beforeCardNumber.match(/Subject\s+([A-Z0-9\s\-]+?)$/i);
        }
        if (subjectMatch) {
          const extracted = subjectMatch[1].trim().replace(/\s+/g, " ");
          // Ograniczenie: tylko jeśli nie zawiera małych liter (które nie powinny być w nazwie karty PSA)
          // i jest krótsze niż 50 znaków
          if (extracted.length > 0 && extracted.length <= 50 && /^[A-Z0-9\s\-]+$/.test(extracted)) {
            cardName = extracted;
            console.log(`[fetchPsaCertificateData] Found card_name from text: "${cardName}"`);
          } else {
            console.log(`[fetchPsaCertificateData] Rejected card_name (invalid: length=${extracted.length}, contains lowercase=${/[a-z]/.test(extracted)}): "${extracted.substring(0, 50)}..."`);
          }
        }
      }
      
      // Card Number (z tekstu) - ważne: nie bierzemy Cert Number, tylko Card Number
      // Szukamy dokładnie: "Card Number" + spacje + cyfry (1-3 cyfry) + opcjonalnie litera + kończy się na "Category" lub koniec tekstu
      if (!cardNumber) {
        // Bardziej precyzyjny regex - tylko cyfry (1-3) + opcjonalnie litera, po "Card Number" ale przed "Category"
        const cnMatch = itemInfoText.match(/Card Number\s+(\d{1,3}[a-zA-Z]?)(?:\s+Category|$)/i);
        if (cnMatch) {
          cardNumber = cnMatch[1].trim();
          console.log(`[fetchPsaCertificateData] Found card_number from text: "${cardNumber}"`);
        } else {
          console.log(`[fetchPsaCertificateData] Card Number not found in text. Preview: ${itemInfoText.substring(0, 500)}`);
        }
      }
    }

    // Fallback: jeśli nie znaleźliśmy w Item Information, spróbuj w całym tekście
    // ALE TYLKO jeśli sekcja "Item Information" została znaleziona - w przeciwnym razie nie parsuj całego HTML
    // (ponieważ to może zbierać cały tekst strony zamiast konkretnych wartości)
    let textContent: string | null = null;
    if (itemInfoText) {
      // Używamy tylko tekstu z sekcji "Item Information", nie całej strony
      textContent = itemInfoText;
    } else {
      // Jeśli nie znaleźliśmy sekcji "Item Information", NIE parsuj całego tekstu
      // (bo to może zbierać cały HTML zamiast konkretnych wartości)
      console.log(`[fetchPsaCertificateData] Skipping full text parsing - Item Information section not found`);
      textContent = null;
    }

    // Card Name (fallback) - TYLKO jeśli textContent jest dostępny (czyli sekcja "Item Information" została znaleziona)
    if (!cardName && textContent) {
      const nameMatch =
        textContent.match(/Subject\s+([A-Z0-9\s\-]{1,50}?)(?:\s+Card Number|$)/i);
      if (nameMatch) {
        const extracted = nameMatch[1].trim().replace(/\s+/g, " ");
        if (extracted.length > 0 && extracted.length <= 50 && /^[A-Z0-9\s\-]+$/.test(extracted)) {
          cardName = extracted;
          console.log(`[fetchPsaCertificateData] Found card_name from fallback text: "${cardName}"`);
        }
      }
    }

    // Set Name (fallback) - TYLKO jeśli textContent jest dostępny
    if (!setName && textContent) {
      const setMatch =
        textContent.match(/Brand\/Title\s+([A-Z0-9\s\-]{1,50}?)(?:\s+Subject|$)/i);
      if (setMatch) {
        const extracted = setMatch[1].trim().replace(/\s+/g, " ");
        if (extracted.length > 0 && extracted.length <= 50 && /^[A-Z0-9\s\-]+$/.test(extracted)) {
          setName = extracted;
          console.log(`[fetchPsaCertificateData] Found set_name from fallback text: "${setName}"`);
        }
      }
    }

    // Card Number (fallback) - TYLKO jeśli textContent jest dostępny
    if (!cardNumber && textContent) {
      const cnMatch =
        textContent.match(/Card Number\s+(\d{1,3}[a-zA-Z]?)(?:\s+Category|$)/i);
      if (cnMatch) {
        cardNumber = cnMatch[1].trim();
        console.log(`[fetchPsaCertificateData] Found card_number from fallback text: "${cardNumber}"`);
      }
    }

    // Year - możemy szukać w całym tekście, bo rok jest krótki i łatwy do znalezienia
    if (year == null) {
      const fullTextForYear = itemInfoText || (doc?.body?.textContent ?? html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " "));
      const yMatch = fullTextForYear.match(/Year\s*:?\s*((19|20)\d{2})/i);
      if (yMatch && yMatch[1]) {
        const parsedYear = parseInt(yMatch[1], 10);
        if (!isNaN(parsedYear) && parsedYear >= 1900 && parsedYear <= 2100) {
          year = parsedYear;
        }
      }
    }

    // Grade - możemy szukać w całym tekście, bo grade jest krótki i łatwy do znalezienia
    if (!grade) {
      const fullTextForGrade = itemInfoText || (doc?.body?.textContent ?? html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " "));
      const gMatch =
        fullTextForGrade.match(/Item Grade\s*:?\s*([A-Z ]*\d+(?:\.\d)?)/i) ||
        fullTextForGrade.match(/Grade\s*:?\s*([A-Z ]*\d+(?:\.\d)?)/i) ||
        fullTextForGrade.match(/\b(GEM MT|MINT|NM\-MT|EX\-MT|VG\-EX|GOOD|PR)\b ?(\d+(?:\.\d)?)?/i);
      if (gMatch) grade = (gMatch[1] ?? gMatch[0]).toString().trim();
    }

    // Image - szukamy zdjęcia SLABU z PSA (karta oceniona w slabie), nie tylko og:image (który może być logo PSA)
    // PSA ma kilka możliwych lokalizacji obrazu slabu:
    // 1. JSON-LD structured data
    // 2. img z klasą zawierającą "card" lub "image" w sekcji z kartą
    // 3. img w głównym kontenerze z kartą
    // 4. data-src lub src z URL zawierającym cert number lub card image
    // 5. Obrazy w sekcji z cert number
    // 6. Obrazy po rozmiarze/ścieżce (slaby mają duże obrazy)
    // 7. og:image jako fallback (ale może być logo)
    
    if (!imageUrl) {
      // 1. Najpierw sprawdź JSON-LD structured data (PSA może używać tego)
      try {
        const jsonLdMatches = html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
        for (const match of jsonLdMatches) {
          try {
            const jsonData = JSON.parse(match[1]);
            // Szukaj image w różnych miejscach JSON-LD
            const findImageInJson = (obj: any): string | null => {
              if (typeof obj === 'string' && obj.includes('http') && obj.match(/\.(jpg|jpeg|png|webp)$/i)) {
                return obj;
              }
              if (typeof obj === 'object' && obj !== null) {
                if (obj.image && typeof obj.image === 'string') {
                  return obj.image;
                }
                if (obj['@type'] === 'ImageObject' && obj.url) {
                  return obj.url;
                }
                for (const key in obj) {
                  const result = findImageInJson(obj[key]);
                  if (result) return result;
                }
              }
              return null;
            };
            const jsonImage = findImageInJson(jsonData);
            if (jsonImage && !jsonImage.includes('logo') && !jsonImage.includes('meta.jpg')) {
              imageUrl = jsonImage;
              console.log(`[fetchPsaCertificateData] Found card image via JSON-LD: ${imageUrl}`);
              break;
            }
          } catch (e) {
            // Ignore JSON parse errors
          }
        }
      } catch (e) {
        // Ignore errors
      }
      
      // 2. Spróbuj znaleźć img z klasą zawierającą "card" lub "image"
      if (!imageUrl) {
        const cardImageSelectors = [
          'img[class*="card"]',
          'img[class*="image"]',
          'img[src*="cert"]',
          'img[data-src*="cert"]',
          'img[data-lazy-src*="cert"]',
          '.card-image img',
          '.cert-image img',
          '[class*="card-image"] img',
          '[class*="cert-image"] img',
          '[id*="card-image"] img',
          '[id*="cert-image"] img',
        ];
        
        for (const selector of cardImageSelectors) {
          try {
            const img = doc?.querySelector(selector);
            const src = img?.getAttribute('src') || 
                       img?.getAttribute('data-src') || 
                       img?.getAttribute('data-lazy-src') ||
                       img?.getAttribute('data-original');
            if (src && src.includes('http') && !src.includes('logo') && !src.includes('icon')) {
              imageUrl = src;
              console.log(`[fetchPsaCertificateData] Found card image via selector "${selector}": ${imageUrl}`);
              break;
            }
          } catch (e) {
            // Ignore selector errors
          }
        }
      }
      
      // 3. Sprawdź background-image w CSS (obraz może być w style attribute lub <style>)
      if (!imageUrl) {
        // Szukaj background-image w inline styles
        const bgImageMatches = html.matchAll(/background-image\s*:\s*url\(["']?([^"')]+)["']?\)/gi);
        for (const match of bgImageMatches) {
          const bgSrc = match[1];
          if (bgSrc && bgSrc.includes('http') && 
              !bgSrc.includes('logo') && 
              !bgSrc.includes('icon') &&
              !bgSrc.includes('foundation') &&
              !bgSrc.includes('meta.jpg')) {
            imageUrl = bgSrc;
            console.log(`[fetchPsaCertificateData] Found image via background-image: ${imageUrl}`);
            break;
          }
        }
      }
      
      // 4. Jeśli nie znaleziono przez selektory i background-image, szukaj w HTML przez regex - zbierz WSZYSTKIE obrazy
      if (!imageUrl) {
        const allImages: string[] = [];
        const imgMatches = html.matchAll(/<img[^>]+(?:src|data-src|data-lazy-src|data-original|data-url)=["']([^"']+)["'][^>]*>/gi);
        for (const match of imgMatches) {
          const imgSrc = match[1];
          if (imgSrc && imgSrc.includes('http')) {
            allImages.push(imgSrc);
          }
        }
        
        console.log(`[fetchPsaCertificateData] Found ${allImages.length} total images in HTML`);
        if (allImages.length > 0) {
          console.log(`[fetchPsaCertificateData] Sample images (first 10):`, allImages.slice(0, 10));
        }
        
        // Filtruj obrazy - szukaj zdjęć slabów, nie logo/ikon
        // Odfiltruj wszystko, co wygląda na logo/meta/icon
        const candidateImages = allImages.filter(imgSrc => {
          const lowerSrc = imgSrc.toLowerCase();
          // Odfiltruj wyraźne logo/ikon/meta/home - również "foundation" (logo PSA)
          // Dodatkowo odfiltruj ikony tabeli, SVG, data:image itp.
          if (lowerSrc.includes('logo') || 
              lowerSrc.includes('icon') || 
              lowerSrc.includes('favicon') ||
              lowerSrc.includes('meta.jpg') ||
              lowerSrc.includes('meta.png') ||
              lowerSrc.includes('/meta/') ||
              lowerSrc.includes('placeholder') ||
              lowerSrc.includes('spinner') ||
              lowerSrc.includes('loading') ||
              lowerSrc.includes('home.jpg') ||
              lowerSrc.includes('home.png') ||
              lowerSrc.includes('foundation') || // Logo PSA ma "foundation"
              lowerSrc.includes('v4/home') || // Ścieżka do logo (v4/home/meta.jpg)
              lowerSrc.includes('table-image-ink') || // Ikona tabeli, nie zdjęcie slabu
              lowerSrc.includes('table-') || // Inne ikony tabeli
              lowerSrc.startsWith('data:image') || // Data URIs (SVG placeholdery)
              lowerSrc.match(/\/home\/|home\.(jpg|png|webp)/i)) {
            console.log(`[fetchPsaCertificateData] Rejected image (looks like logo/icon): ${imgSrc}`);
            return false;
          }
          
          // PRIORYTET 1: Obrazy z CloudFront, które zawierają "cert" w ścieżce (prawdziwe zdjęcia slabów!)
          // Przykład: https://d1htnxwo4o0jhw.cloudfront.net/cert/186364651/small/Y72p9T26qUGw0HNn_XHvfA_dac2e.jpg
          const isCloudFrontCert = imgSrc.includes('cloudfront.net') && 
                                   (imgSrc.includes('/cert/') || imgSrc.match(/\/cert\/\d+/));
          
          if (isCloudFrontCert) {
            // Sprawdź, czy zawiera cert number (częściowo lub w pełni)
            const hasCertNumber = imgSrc.includes(certNumber) || 
                                 imgSrc.match(new RegExp(`/cert/${certNumber.substring(0, 6)}|/cert/${certNumber.substring(certNumber.length - 4)}`));
            
            if (hasCertNumber || imgSrc.includes('/cert/')) {
              console.log(`[fetchPsaCertificateData] Candidate CloudFront slab image: ${imgSrc} (hasCertNumber: ${!!hasCertNumber})`);
              return true;
            }
          }
          
          // PRIORYTET 2: Obrazy z CloudFront, które wyglądają na zdjęcia (rozszerzenia .jpg, .jpeg, .png, .webp)
          if (imgSrc.includes('cloudfront.net') && imgSrc.match(/\.(jpg|jpeg|png|webp)(\?|$)/i)) {
            // Odfiltruj obrazy z bardzo krótkimi ścieżkami (prawdopodobnie ikony)
            const pathParts = imgSrc.split('/');
            if (pathParts.length > 6) { // CloudFront cert images mają długie ścieżki
              console.log(`[fetchPsaCertificateData] Candidate CloudFront image: ${imgSrc}`);
              return true;
            }
          }
          
          // PRIORYTET 3: Obrazy z PSA, które zawierają cert number
          const hasCertNumber = imgSrc.includes(certNumber) || 
                               imgSrc.match(new RegExp(`/${certNumber.substring(0, 6)}|/${certNumber.substring(certNumber.length - 4)}`));
          const looksLikeSlabImage = imgSrc.includes('cert') || 
                                     imgSrc.includes('slab') ||
                                     imgSrc.match(/\/\d{6,10}\.(jpg|jpeg|png|webp)/i) || // Numery certyfikatu w ścieżce
                                     imgSrc.match(/[0-9]{3,4}x[0-9]{3,4}/); // Rozmiary (np. 800x600)
          
          // MUSI być z domeny PSA i wyglądać na zdjęcie slabu (nie logo)
          const isFromPSA = imgSrc.includes('psacard.com') || imgSrc.includes('images.psacard.com');
          
          if (isFromPSA && (hasCertNumber || looksLikeSlabImage)) {
            // Odfiltruj ikony tabeli i inne placeholdery
            if (!lowerSrc.includes('table-') && !lowerSrc.startsWith('data:image')) {
              console.log(`[fetchPsaCertificateData] Candidate PSA slab image: ${imgSrc} (hasCertNumber: ${!!hasCertNumber}, looksLikeSlab: ${!!looksLikeSlabImage})`);
              return true;
            }
          }
          
          return false;
        });
        
        console.log(`[fetchPsaCertificateData] Filtered to ${candidateImages.length} candidate images`);
        if (candidateImages.length > 0) {
          console.log(`[fetchPsaCertificateData] Candidate images:`, candidateImages.slice(0, 10));
        }
        
        // PRIORYTET 1: Obrazy z CloudFront (prawdziwe zdjęcia slabów!)
        // Preferuj obrazy BEZ /small/, /thumb/ itp. - to są pełne obrazy (nie przycięte)
        const cloudFrontImages = candidateImages.filter(img => img.includes('cloudfront.net'));
        
        // Podziel obrazy na pełne (bez /small/, /thumb/) i miniaturki
        const fullCloudFrontImages = cloudFrontImages.filter(img => {
          const lower = img.toLowerCase();
          return !lower.includes('/small/') && 
                 !lower.includes('/thumb/') && 
                 !lower.includes('/thumbnail/') && 
                 !lower.includes('/medium/') &&
                 !lower.includes('/tiny/');
        });
        
        // Używaj najpierw pełnych obrazów, potem miniaturki jako fallback
        const imagesToUse = fullCloudFrontImages.length > 0 ? fullCloudFrontImages : cloudFrontImages;
        
        if (imagesToUse.length > 0) {
          console.log(`[fetchPsaCertificateData] Found ${imagesToUse.length} CloudFront images (${fullCloudFrontImages.length} full size, ${cloudFrontImages.length - fullCloudFrontImages.length} thumbnails)`);
          // Wybierz obraz, który zawiera cert number w ścieżce
          const imageWithCertNumber = imagesToUse.find(img => 
            img.includes(certNumber) || 
            img.match(new RegExp(`/cert/${certNumber.substring(0, 6)}|/cert/${certNumber.substring(certNumber.length - 4)}`))
          );
          
          if (imageWithCertNumber) {
            imageUrl = imageWithCertNumber;
            console.log(`[fetchPsaCertificateData] Selected CloudFront slab image (contains cert number): ${imageUrl}`);
          } else {
            // Jeśli nie ma cert number, wybierz pierwszy obraz z /cert/ w ścieżce
            const certImage = imagesToUse.find(img => img.includes('/cert/'));
            if (certImage) {
              imageUrl = certImage;
              console.log(`[fetchPsaCertificateData] Selected CloudFront slab image (from cert path): ${imageUrl}`);
            } else {
              // Ostatnia opcja - pierwszy pełny obraz z CloudFront
              imageUrl = imagesToUse[0];
              console.log(`[fetchPsaCertificateData] Selected CloudFront image (fallback): ${imageUrl}`);
            }
          }
        } else {
          // PRIORYTET 2: Obrazy z domeną PSA (tylko jeśli nie ma CloudFront)
          const psaImages = candidateImages.filter(img => 
            img.includes('psacard.com') || img.includes('images.psacard.com')
          );
          
          if (psaImages.length > 0) {
            console.log(`[fetchPsaCertificateData] Found ${psaImages.length} PSA images (no CloudFront found)`);
            // Odfiltruj ikony tabeli i placeholdery
            const realImages = psaImages.filter(img => {
              const lowerImg = img.toLowerCase();
              return !lowerImg.includes('table-image-ink') && 
                     !lowerImg.includes('table-') &&
                     !lowerImg.startsWith('data:image');
            });
            
            // Preferuj obrazy BEZ /small/, /thumb/ - to są pełne obrazy (nie przycięte)
            const fullPsaImages = realImages.filter(img => {
              const lower = img.toLowerCase();
              return !lower.includes('/small/') && 
                     !lower.includes('/thumb/') && 
                     !lower.includes('/thumbnail/') && 
                     !lower.includes('/medium/');
            });
            
            // Używaj najpierw pełnych obrazów, potem miniaturki jako fallback
            const psaImagesToUse = fullPsaImages.length > 0 ? fullPsaImages : realImages;
            
            if (psaImagesToUse.length > 0) {
              console.log(`[fetchPsaCertificateData] Using ${psaImagesToUse.length} PSA images (${fullPsaImages.length} full size, ${realImages.length - fullPsaImages.length} thumbnails)`);
              // Wybierz obraz, który ZAWARTY ma cert number w URL (najlepsza opcja)
              const imageWithCertNumber = psaImagesToUse.find(img => img.includes(certNumber));
              if (imageWithCertNumber) {
                imageUrl = imageWithCertNumber;
                console.log(`[fetchPsaCertificateData] Selected PSA slab image (contains cert number): ${imageUrl}`);
              } else {
                // Jeśli nie ma cert number w URL, wybierz obraz, który wygląda na zdjęcie slabu
                const slabImage = psaImagesToUse.find(img => {
                  const lowerImg = img.toLowerCase();
                  return (lowerImg.includes('cert') || 
                         lowerImg.includes('card') ||
                         lowerImg.includes('slab') ||
                         lowerImg.match(/\/\d{6,10}\.(jpg|jpeg|png|webp)/i) || // Numery certyfikatu w ścieżce
                         lowerImg.match(/[0-9]{3,4}x[0-9]{3,4}/)); // Rozmiary
                });
                
                if (slabImage) {
                  imageUrl = slabImage;
                  console.log(`[fetchPsaCertificateData] Selected PSA slab image (looks like slab): ${imageUrl}`);
                } else {
                  // Ostatnia opcja - wybierz obraz, ale całkowicie odfiltruj logo PSA
                  // Logo PSA ma typowe ścieżki: /v4/home/meta.jpg, zawiera "foundation", lub jest bardzo krótka ścieżka
                  const nonLogoImage = psaImagesToUse.find(img => {
                    const lowerImg = img.toLowerCase();
                    // Całkowicie odfiltruj logo - ma charakterystyczne ścieżki
                    if (lowerImg.includes('foundation') || 
                        lowerImg.includes('v4/home') ||
                        lowerImg.includes('/home/') ||
                        lowerImg.match(/\/home\.[jpg|png|webp]/i) ||
                        lowerImg.includes('meta.jpg') ||
                        lowerImg.includes('meta.png')) {
                      return false;
                    }
                    // Zdjęcia slabów mają dłuższe ścieżki niż logo
                    const pathParts = img.split('/');
                    if (pathParts.length <= 5) {
                      return false; // Za krótka ścieżka = prawdopodobnie logo
                    }
                    // Zdjęcia slabów często mają numery lub słowa typu "cert", "card", "image" w ścieżce
                    const hasSlabIndicators = lowerImg.includes('cert') || 
                                             lowerImg.includes('card') ||
                                             lowerImg.includes('image') ||
                                             lowerImg.includes('slab') ||
                                             lowerImg.match(/\/\d+\.(jpg|jpeg|png|webp)/i);
                    return hasSlabIndicators;
                  });
              
              if (nonLogoImage) {
                imageUrl = nonLogoImage;
                console.log(`[fetchPsaCertificateData] Selected PSA image (filtered non-logo): ${imageUrl}`);
              } else {
                // Jeśli wszystkie obrazy wyglądają jak logo, nie używaj żadnego
                console.log(`[fetchPsaCertificateData] All PSA images look like logos, skipping image`);
                // Nie ustawiamy imageUrl - pozostaje undefined
              }
                }
              }
            }
          }
        }
      }
    }
    
    // 5. Fallback: og:image (ale może być logo PSA) - NIE używamy jako fallback, bo zawsze jest logo/meta
    // Pomińmy og:image całkowicie, bo zawsze zwraca logo PSA lub meta.jpg
    if (!imageUrl) {
      const ogImage =
        doc?.querySelector('meta[property="og:image"]')?.getAttribute("content") ??
        html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i)?.[1] ??
        undefined;
      if (ogImage) {
        // NIE używamy og:image - zawsze jest logo/meta.jpg
        console.log(`[fetchPsaCertificateData] Rejected og:image (always logo/meta): ${ogImage}`);
      }
    }
    
    // Logowanie końcowe
    if (imageUrl) {
      console.log(`[fetchPsaCertificateData] Final image URL: ${imageUrl}`);
    } else {
      console.log(`[fetchPsaCertificateData] No card image found from PSA HTML`);
    }
    
    // Jeśli nadal nie znaleziono, spróbuj jeszcze bardziej agresywne szukanie - może obraz jest w sekcji z kartą
    if (!imageUrl) {
      console.log(`[fetchPsaCertificateData] Trying aggressive search - looking in cert section...`);
      
      // Spróbuj znaleźć obraz w sekcji, która zawiera cert number - szukaj większej sekcji
      // Szukaj w większym kontekście - może obraz jest blisko nazwy karty lub setu
      const certSectionMatch = html.match(new RegExp(`(?:cert|certificate|cert\\s*#|certification)[\\s\\S]{0,3000}${certNumber}[\\s\\S]{0,5000}`, 'i'));
      if (certSectionMatch) {
        console.log(`[fetchPsaCertificateData] Found section with cert number (length: ${certSectionMatch[0].length}), searching for images...`);
        
        // Szukaj wszystkich img w tej sekcji (również background-image)
        const imgMatches = certSectionMatch[0].matchAll(/<img[^>]+(?:src|data-src|data-lazy-src|data-original|data-url)=["']([^"']+)["'][^>]*>/gi);
        const bgImageMatches = certSectionMatch[0].matchAll(/background-image\s*:\s*url\(["']?([^"')]+)["']?\)/gi);
        
        const imagesInSection: string[] = [];
        
        // Dodaj obrazy z img tagów
        for (const match of imgMatches) {
          const imgSrc = match[1];
          if (imgSrc && imgSrc.includes('http')) {
            imagesInSection.push(imgSrc);
          }
        }
        
        // Dodaj obrazy z background-image
        for (const match of bgImageMatches) {
          const bgSrc = match[1];
          if (bgSrc && bgSrc.includes('http')) {
            imagesInSection.push(bgSrc);
          }
        }
        
        console.log(`[fetchPsaCertificateData] Found ${imagesInSection.length} images in cert section`);
        if (imagesInSection.length > 0) {
          console.log(`[fetchPsaCertificateData] Images in cert section:`, imagesInSection.slice(0, 10));
        }
        
        // Znajdź pierwszy obraz, który wygląda na zdjęcie slabu (nie logo)
        for (const imgSrc of imagesInSection) {
          const lowerSrc = imgSrc.toLowerCase();
          
          // Całkowicie odfiltruj logo
          if (lowerSrc.includes('logo') || 
              lowerSrc.includes('icon') ||
              lowerSrc.includes('favicon') ||
              lowerSrc.includes('meta.jpg') ||
              lowerSrc.includes('meta.png') ||
              lowerSrc.includes('foundation') ||
              lowerSrc.includes('v4/home') ||
              lowerSrc.includes('/home/')) {
            continue;
          }
          
          // Preferuj obrazy z PSA, które zawierają cert number lub wyglądają na zdjęcia
          const isFromPSA = imgSrc.includes('psacard.com') || imgSrc.includes('images.psacard.com');
          const hasCertNumber = imgSrc.includes(certNumber);
          const hasSlabIndicators = lowerSrc.includes('cert') || 
                                   lowerSrc.includes('card') ||
                                   lowerSrc.includes('slab') ||
                                   lowerSrc.match(/\/\d{6,10}\.(jpg|jpeg|png|webp)/i);
          
          if (isFromPSA && (hasCertNumber || hasSlabIndicators)) {
            imageUrl = imgSrc;
            console.log(`[fetchPsaCertificateData] Found slab image in cert section: ${imageUrl} (hasCertNumber: ${hasCertNumber}, hasSlabIndicators: ${hasSlabIndicators})`);
            break;
          }
          
          // Jeśli nie znalazł z PSA, ale obraz wygląda na zdjęcie (ma dłuższą ścieżkę), użyj go
          if (!isFromPSA && imgSrc.split('/').length > 5 && imgSrc.match(/\.(jpg|jpeg|png|webp)$/i)) {
            imageUrl = imgSrc;
            console.log(`[fetchPsaCertificateData] Found image in cert section (non-PSA): ${imageUrl}`);
            break;
          }
        }
      }
      
      // Ostatnia próba - może obraz jest w sekcji z nazwą karty lub setu
      if (!imageUrl && cardName) {
        // Szukaj w sekcji, która zawiera nazwę karty (może być blisko zdjęcia)
        const cardNameNormalized = cardName.replace(/[^a-z0-9]/gi, '').substring(0, 10); // Pierwsze 10 znaków alfanumerycznych
        if (cardNameNormalized.length > 3) {
          const cardSectionMatch = html.match(new RegExp(`${cardNameNormalized}[\\s\\S]{0,2000}`, 'i'));
          if (cardSectionMatch) {
            console.log(`[fetchPsaCertificateData] Found section with card name, searching for images...`);
            const imgMatches = cardSectionMatch[0].matchAll(/<img[^>]+(?:src|data-src|data-lazy-src|data-original)=["']([^"']+)["'][^>]*>/gi);
            for (const match of imgMatches) {
              const imgSrc = match[1];
              if (imgSrc && imgSrc.includes('http') && 
                  !imgSrc.toLowerCase().includes('logo') &&
                  !imgSrc.toLowerCase().includes('foundation') &&
                  !imgSrc.toLowerCase().includes('v4/home')) {
                imageUrl = imgSrc;
                console.log(`[fetchPsaCertificateData] Found image near card name: ${imageUrl}`);
                break;
              }
            }
          }
        }
      }
    }
    
    // Ostateczne logowanie
    if (imageUrl) {
      console.log(`[fetchPsaCertificateData] Final image URL (after all attempts): ${imageUrl}`);
      
      // Wyczyść URL obrazu - usuń parametry przycinające i zamień /small/ na pełny obraz
      imageUrl = cleanImageUrl(imageUrl, certNumber);
      console.log(`[fetchPsaCertificateData] Cleaned image URL (full size, no crop params): ${imageUrl}`);
    } else {
      console.log(`[fetchPsaCertificateData] No card image found - will use placeholder or skip`);
    }

    // Logowanie przed walidacją
    console.log(`[fetchPsaCertificateData] Values before validation:`, {
      cardName: cardName ? `${cardName.substring(0, 100)}... (length: ${cardName.length})` : "not set",
      setName: setName ? `${setName.substring(0, 100)}... (length: ${setName.length})` : "not set",
      cardNumber: cardNumber || "not set",
      year: year || "not set",
      grade: grade || "not set",
    });

    // Walidacja: odrzuć wartości, które są zbyt długie lub zawierają nieprawidłowe znaki
    // (może to oznaczać, że zbieramy cały HTML zamiast konkretnych wartości)
    if (cardName) {
      const isInvalid = cardName.length > 100 || 
                        /[a-z]/.test(cardName) || 
                        cardName.includes('Card Ladder') || 
                        cardName.includes('PSA Near Me') ||
                        cardName.includes('Facts') ||
                        cardName.includes('Sales History');
      if (isInvalid) {
        console.log(`[fetchPsaCertificateData] Rejected card_name (too long or invalid): length=${cardName.length}, content="${cardName.substring(0, 100)}..."`);
        cardName = undefined;
      }
    }
    
    if (setName) {
      const isInvalid = setName.length > 100 || 
                        /[a-z]/.test(setName) || 
                        setName.includes('Registry') || 
                        setName.includes('Research') ||
                        setName.includes('Cert Verification') ||
                        setName.includes('Population Report');
      if (isInvalid) {
        console.log(`[fetchPsaCertificateData] Rejected set_name (too long or invalid): length=${setName.length}, content="${setName.substring(0, 100)}..."`);
        setName = undefined;
      }
    }
    
    // card_number powinno być krótkie (1-3 cyfry + opcjonalnie litera)
    // Odrzuć też wartości, które wyglądają jak początek numeru certyfikatu (np. "125" z "125866845")
    if (cardNumber) {
      const isInvalid = cardNumber.length > 10 || 
                        !/^\d{1,3}[a-zA-Z]?$/.test(cardNumber) ||
                        (cardNumber.length === 3 && parseInt(cardNumber) > 200); // Prawdopodobnie początek cert number, nie card number
      if (isInvalid) {
        console.log(`[fetchPsaCertificateData] Rejected card_number (invalid format): "${cardNumber}"`);
        cardNumber = undefined;
      }
    }

    // Logowanie przed sprawdzeniem hasAny - sprawdźmy, czy mamy przynajmniej year lub grade
    console.log(`[fetchPsaCertificateData] Parsing results (after validation):`, {
      cardName: cardName || "not found",
      setName: setName || "not found",
      cardNumber: cardNumber || "not found",
      year: year || "not found",
      grade: grade || "not found",
    });

    // Sprawdź, czy mamy jakiekolwiek dane (nawet jeśli niektóre są nieprawidłowe)
    // year i grade powinny być łatwiejsze do wyciągnięcia i nie powinny być odrzucane
    const hasAny =
      Boolean(cardName) ||
      Boolean(setName) ||
      Boolean(cardNumber) ||
      Boolean(year) ||
      Boolean(grade);

    console.log(`[fetchPsaCertificateData] hasAny check: ${hasAny} (cardName: ${Boolean(cardName)}, setName: ${Boolean(setName)}, cardNumber: ${Boolean(cardNumber)}, year: ${Boolean(year)}, grade: ${Boolean(grade)})`);

    if (!hasAny) {
      console.log(`[fetchPsaCertificateData] No data found at all - cannot proceed`);
      return { ok: false, error: "Unable to parse PSA certificate page" };
    }

    // Ostateczna walidacja przed zwróceniem - upewnij się, że wartości są poprawne
    // (nawet jeśli przeszły wcześniejsze walidacje, mogą być nieprawidłowe)
    const finalCardName = cardName && cardName.length <= 100 && !cardName.includes('Card Ladder') && !cardName.includes('PSA Near Me') && !cardName.includes('Facts') && !cardName.includes('Sales History') ? cardName : undefined;
    const finalSetName = setName && setName.length <= 100 && !setName.includes('Registry') && !setName.includes('Research') && !setName.includes('Cert Verification') && !setName.includes('Population Report') ? setName : undefined;
    const finalCardNumber = cardNumber && cardNumber.length <= 10 && /^\d{1,3}[a-zA-Z]?$/.test(cardNumber) && !(cardNumber.length === 3 && parseInt(cardNumber) > 200) ? cardNumber : undefined;

    console.log(`[fetchPsaCertificateData] Final values before return:`, {
      cardName: finalCardName || "rejected",
      setName: finalSetName || "rejected",
      cardNumber: finalCardNumber || "rejected",
      year: year || "not set",
      grade: grade || "not set",
    });

    // Sprawdź, czy mamy jakiekolwiek użyteczne dane po ostatecznej walidacji
    const finalHasAny =
      Boolean(finalCardName) ||
      Boolean(finalSetName) ||
      Boolean(finalCardNumber) ||
      Boolean(year) ||
      Boolean(grade);

    if (!finalHasAny) {
      console.log(`[fetchPsaCertificateData] No valid data after final validation`);
      return { ok: false, error: "Unable to parse PSA certificate page" };
    }

    return {
      ok: true,
      data: {
        card_name: finalCardName,
        set_name: finalSetName,
        card_number: finalCardNumber,
        year,
        grade,
        image_url: imageUrl,
      },
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

// Stub verification logic - simulates API calls to grading companies (fallback for unsupported)
async function verifyCertificate(
  company: string,
  certNumber: string,
  grade?: string
): Promise<VerifyResponse> {
  // Normalize company name
  const normalizedCompany = company.toLowerCase().trim();

  // PSA: https://www.psacard.com/cert/
  // BGS: https://www.beckett.com/grading/card-lookup
  // CGC: https://www.cgccards.com/certlookup/

  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 150));

  // Basic validation - check format
  if (!certNumber || certNumber.length < 4) {
    return {
      verified: false,
      valid: false,
      error: "Invalid certificate number format",
    };
  }

  // Stub responses based on company
  switch (normalizedCompany) {
    case "psa":
    case "psa grading":
      // PSA format: typically 6-10 digits (bywają krótsze starsze)
      if (!/^\d{6,10}$/.test(certNumber)) {
        return {
          verified: false,
          valid: false,
          error: "PSA certificate number must be 8-10 digits",
        };
      }

      // Real attempt to fetch PSA page
      try {
        console.log(`[verifyCertificate] Fetching PSA data for cert ${certNumber}`);
        const psa = await fetchPsaCertificateData(certNumber);
        console.log(`[verifyCertificate] PSA response:`, { ok: psa.ok, hasData: !!psa.data, error: psa.error });
        
        if (psa.ok && psa.data) {
          const localSlugify = (input: string) =>
            input
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/^-+|-+$/g, "");
          const setSlug =
            psa.data.set_name ? localSlugify(`english-${psa.data.set_name}`) : undefined;
          console.log(`[verifyCertificate] Parsed data:`, { setSlug, cardName: psa.data.card_name, set_name: psa.data.set_name });
          
      return {
        verified: true,
        valid: true,
        data: {
              grading_company: "PSA",
          certificate_number: certNumber,
              grade: psa.data.grade || grade || "",
              card_name: psa.data.card_name,
              set_name: psa.data.set_name,
              card_number: psa.data.card_number,
              year: psa.data.year,
              set_slug: setSlug,
              image_url: psa.data.image_url,
          grading_date: new Date().toISOString().split("T")[0],
            },
          };
        }
        // Fallback to minimal valid=false with cause - NIE zwracamy data, tylko error
        console.log(`[verifyCertificate] PSA fetch failed:`, psa.error);
        return {
          verified: false,
          valid: false,
          error: psa.error || "Unable to verify PSA certificate",
          // NIE zwracamy data - frontend nie powinien próbować uzupełniać pustych danych
        };
      } catch (e) {
        console.error(`[verifyCertificate] Exception during PSA fetch:`, e);
        return {
          verified: false,
          valid: false,
          error: e instanceof Error ? e.message : "Unknown PSA parsing error",
          // NIE zwracamy data - frontend nie powinien próbować uzupełniać pustych danych
        };
      }

    case "bgs":
    case "beckett":
    case "bgs / beckett":
      // BGS format: typically alphanumeric or numeric
      if (!/^[A-Z0-9]{6,12}$/i.test(certNumber)) {
        return {
          verified: false,
          valid: false,
          error: "BGS certificate number format invalid",
        };
      }
      return {
        verified: true,
        valid: true,
        data: {
          certificate_number: certNumber,
          grade: grade || "9.5",
          grading_date: new Date().toISOString().split("T")[0],
        },
      };

    case "cgc":
    case "cgc cards":
      // CGC format: typically numeric
      if (!/^\d{6,10}$/.test(certNumber)) {
        return {
          verified: false,
          valid: false,
          error: "CGC certificate number must be 6-10 digits",
        };
      }
      return {
        verified: true,
        valid: true,
        data: {
          certificate_number: certNumber,
          grade: grade || "10",
          grading_date: new Date().toISOString().split("T")[0],
        },
      };

    case "sgc":
    case "sgc grading":
      // SGC format: typically numeric
      if (!/^\d{6,10}$/.test(certNumber)) {
        return {
          verified: false,
          valid: false,
          error: "SGC certificate number format invalid",
        };
      }
      return {
        verified: true,
        valid: true,
        data: {
          certificate_number: certNumber,
          grade: grade || "10",
          grading_date: new Date().toISOString().split("T")[0],
        },
      };

    default:
      return {
        verified: false,
        valid: false,
        error: `Unsupported grading company: ${company}`,
      };
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

    if (!supabaseUrl || !supabaseKey) {
      return new Response(
        JSON.stringify({
          error: "Configuration error",
          message:
            "Missing SUPABASE_URL or SUPABASE_ANON_KEY in Edge Function environment",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const admin = serviceKey ? createClient(supabaseUrl, serviceKey) : null;

    // Verify authentication (with optional dev bypass)
    const authHeader = req.headers.get("Authorization");
    const url = new URL(req.url);
    const qpBypass = ["1", "true"].includes((url.searchParams.get("dev") ?? url.searchParams.get("bypass") ?? "").toLowerCase());
    const headerBypassRaw =
      req.headers.get("x-dev-bypass-auth") ??
      req.headers.get("X-Dev-Bypass-Auth") ??
      "";
    // NIE sprawdzamy apikey jako dev bypass, bo supabase.functions.invoke zawsze dodaje SUPABASE_ANON_KEY
    const devBypass =
      qpBypass ||
      ["1", "true"].includes(headerBypassRaw.trim().toLowerCase());

    console.log("[EdgeFunction] Auth check:", {
      hasAuthHeader: !!authHeader,
      authHeaderPrefix: authHeader?.substring(0, 20) || "none",
      devBypass,
      qpBypass,
      headerBypassRaw,
    });

    let user: { id: string } | null = null;
    if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.replace("Bearer ", "");
    const {
        data: { user: u },
      error: authError,
    } = await supabase.auth.getUser(token);
      if (!authError && u) {
        user = { id: u.id };
        console.log("[EdgeFunction] User authenticated:", u.id);
      } else {
        console.log("[EdgeFunction] Auth error:", authError?.message || "No user");
      }
    }

    if (!user && !devBypass) {
      console.log("[EdgeFunction] Rejecting request: no user and no dev bypass");
      return new Response(
        JSON.stringify({ 
          error: "Invalid or expired token",
          debug: {
            hasAuthHeader: !!authHeader,
            devBypass,
          }
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Parse request body
    let body: VerifyRequest;
    try {
      body = await req.json() as VerifyRequest;
    } catch (e) {
      console.error("[EdgeFunction] Failed to parse request body:", e);
      return new Response(
        JSON.stringify({ 
          error: "Invalid JSON body", 
          message: e instanceof Error ? e.message : "Failed to parse JSON",
          details: "Expecting application/json with { grading_company: string, certificate_number: string, grade?: string }"
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const { grading_company, certificate_number, grade } = body;

    if (!grading_company || !certificate_number) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields: grading_company, certificate_number",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Dev short-circuit: return stubbed success to unblock local/frontend tests
    if (devBypass) {
      const stub: VerifyResponse = {
        verified: true,
        valid: true,
        data: {
          grading_company: grading_company.toUpperCase(),
          certificate_number,
          grade: "10",
          // Minimal helpful fields to auto‑uzupełnić formularz
          card_name: "Pikachu",
          set_name: "Base Set",
          year: 1999,
          set_slug: "english-base-set",
          image_url: "https://images.psacard.com/default_card.jpg",
          grading_date: new Date().toISOString().split("T")[0],
        },
      };
      return new Response(JSON.stringify(stub), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Simple rate limit: max 10 checks per minute per user
    if (admin && user) {
      const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
      const { count, error: rlErr } = await admin
        .from("certificate_cache")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("last_checked_at", oneMinuteAgo);

      if (!rlErr && typeof count === "number" && count >= 10) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    // Try cache (valid for 24h) - skip if ?no-cache=1
    let result: VerifyResponse | null = null;
    const skipCache = ["1", "true"].includes((url.searchParams.get("no-cache") ?? "").toLowerCase());
    const CACHE_TTL_HOURS = 24;
    if (admin && !skipCache) {
      try {
        console.log("[EdgeFunction] Checking cache for:", { grading_company: grading_company.toLowerCase(), certificate_number });
        const { data: cached, error: cacheError } = await admin
          .from("certificate_cache")
          .select("*")
          .eq("grading_company", grading_company.toLowerCase())
          .eq("certificate_number", certificate_number)
          .single();

        if (cacheError && cacheError.code !== "PGRST116") { // PGRST116 = no rows returned
          console.error("[EdgeFunction] Cache query error:", cacheError);
        }

        if (
          cached &&
          cached.last_checked_at &&
          Date.now() - new Date(cached.last_checked_at).getTime() < CACHE_TTL_HOURS * 3600 * 1000
        ) {
          console.log("[EdgeFunction] Cache hit, returning cached data");
          // Sprawdź, czy cache ma użyteczne dane (nie tylko podstawowe pola)
          const hasUsefulCachedData = cached.data?.card_name || 
            cached.data?.set_name || 
            cached.data?.year || 
            cached.data?.card_number ||
            cached.data?.image_url;
          
          if (hasUsefulCachedData) {
            // Walidacja wartości z cache - odrzuć nieprawidłowe wartości (np. zawierające cały HTML)
            const cachedCardName = cached.data?.card_name;
            const cachedSetName = cached.data?.set_name;
            const cachedCardNumber = cached.data?.card_number;
            const cachedImageUrl = cached.data?.image_url;
            
            // Sprawdź, czy wartości są prawidłowe (nie zawierają słów nawigacyjnych lub nie są za długie)
            const isValidCardName = cachedCardName && 
              cachedCardName.length <= 100 && 
              !cachedCardName.includes('Card Ladder') && 
              !cachedCardName.includes('PSA Near Me') && 
              !cachedCardName.includes('Facts') && 
              !cachedCardName.includes('Sales History');
            
            const isValidSetName = cachedSetName && 
              cachedSetName.length <= 100 && 
              !cachedSetName.includes('Registry') && 
              !cachedSetName.includes('Research') && 
              !cachedSetName.includes('Cert Verification') && 
              !cachedSetName.includes('Population Report');
            
            const isValidCardNumber = cachedCardNumber && 
              cachedCardNumber.length <= 10 && 
              /^\d{1,3}[a-zA-Z]?$/.test(cachedCardNumber) && 
              !(cachedCardNumber.length === 3 && parseInt(cachedCardNumber) > 200);
            
            // Walidacja image_url - odrzuć logo PSA, ikony, placeholdery
            const isValidImageUrl = cachedImageUrl ? 
              !cachedImageUrl.toLowerCase().includes('foundation') &&
              !cachedImageUrl.toLowerCase().includes('v4/home') &&
              !cachedImageUrl.toLowerCase().includes('/home/') &&
              !cachedImageUrl.toLowerCase().includes('meta.jpg') &&
              !cachedImageUrl.toLowerCase().includes('meta.png') &&
              !cachedImageUrl.toLowerCase().includes('home.jpg') &&
              !cachedImageUrl.toLowerCase().includes('home.png') &&
              !cachedImageUrl.toLowerCase().includes('table-image-ink') && // Ikona tabeli, nie zdjęcie slabu
              !cachedImageUrl.toLowerCase().includes('logo') &&
              !cachedImageUrl.toLowerCase().match(/\/home\.[jpg|png|webp]/i) :
              true; // Jeśli nie ma image_url, to OK
            
            // Jeśli wartości są nieprawidłowe, ignoruj cache i spróbuj ponownie
            if ((cachedCardName && !isValidCardName) || 
                (cachedSetName && !isValidSetName) || 
                (cachedCardNumber && !isValidCardNumber) ||
                !isValidImageUrl) {
              console.log("[EdgeFunction] Cache contains invalid data (HTML fragments or logo PSA detected), ignoring cache");
              console.log("[EdgeFunction] Invalid image_url:", cachedImageUrl, "isValid:", isValidImageUrl);
              result = null;
            } else {
              console.log("[EdgeFunction] Cache hit, returning validated cached data");
              result = {
                verified: Boolean(cached.verified),
                valid: Boolean(cached.valid),
                data: {
                  certificate_number: certificate_number,
                  grade: cached.data?.grade ?? "",
                  grading_company: cached.data?.grading_company ?? grading_company.toUpperCase(),
                  card_name: isValidCardName ? cachedCardName : undefined,
                  set_name: isValidSetName ? cachedSetName : undefined,
                  card_number: isValidCardNumber ? cachedCardNumber : undefined,
                  year: cached.data?.year ?? undefined,
                  set_slug: cached.data?.set_slug ?? undefined,
                  image_url: isValidImageUrl ? cachedImageUrl : undefined, // Użyj image_url tylko jeśli jest poprawne (nie logo)
                  grading_date: cached.data?.grading_date ?? undefined,
                  pop_report: cached.data?.pop_report ?? undefined,
                },
              };
            }
          } else {
            console.log("[EdgeFunction] Cache has only basic data, ignoring cache");
            // Cache ma tylko podstawowe pola (prawdopodobnie stary błąd), ignoruj cache i spróbuj ponownie
            result = null;
          }
        } else {
          console.log("[EdgeFunction] Cache miss or expired");
        }
      } catch (cacheErr) {
        console.error("[EdgeFunction] Cache check exception:", cacheErr);
        // Continue without cache - not critical
      }
    }

    // Verify certificate if cache miss/expired
    if (!result) {
      console.log("[EdgeFunction] Cache miss, fetching from PSA");
      result = await verifyCertificate(
      grading_company,
      certificate_number,
      grade
    );
      console.log("[EdgeFunction] Verification result:", { verified: result.verified, valid: result.valid, hasData: !!result.data });
      
      // Upsert cache (non-blocking - if it fails, we still return the result)
      if (admin) {
        try {
          await admin
            .from("certificate_cache")
            .upsert({
              grading_company: grading_company.toLowerCase(),
              certificate_number,
              data: result.data ?? {},
              verified: result.verified,
              valid: result.valid,
              last_checked_at: new Date().toISOString(),
              user_id: user ? user.id : null,
            }, { onConflict: "grading_company,certificate_number" } as any);
          console.log("[EdgeFunction] Cache updated successfully");
        } catch (cacheErr) {
          console.error("[EdgeFunction] Cache update failed (non-critical):", cacheErr);
          // Continue - cache failure is not critical
        }
      }
    }

    // Log verification attempt (optional - for analytics)
    if (result.verified && admin && user) {
      try {
        await admin
          .from("certificate_verifications")
          .insert({
        user_id: user.id,
        grading_company: grading_company.toLowerCase(),
        certificate_number: certificate_number,
        verified: true,
        verified_at: new Date().toISOString(),
      });
      } catch (logError) {
        // Ignore logging errors - not critical
        console.error("[EdgeFunction] Failed to log verification (non-critical):", logError);
      }
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[EdgeFunction] Error in verify-certificate function:", error);
    console.error("[EdgeFunction] Error stack:", error instanceof Error ? error.stack : "No stack");
    console.error("[EdgeFunction] Error details:", {
      message: error instanceof Error ? error.message : String(error),
      name: error instanceof Error ? error.name : typeof error,
      cause: error instanceof Error ? error.cause : undefined,
    });
    
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
        details: error instanceof Error ? {
          name: error.name,
          stack: error.stack?.split('\n').slice(0, 5).join('\n'), // First 5 lines of stack
        } : undefined,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

