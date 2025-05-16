#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import re
import sys
from urllib.parse import urljoin, urlparse
import requests

def extract_image_urls(html):
    """
    Extrait toutes les URLs d'images depuis un bloc HTML.
    Cherche les attributs src et data-src des balises <img>.
    """
    # regex pour src="..." ou src='...'
    pattern = re.compile(r'<img[^>]+(?:src|data-src)=["\']([^"\'>]+)["\']', re.IGNORECASE)
    return pattern.findall(html)

def sanitize_filename(url):
    """
    Génère un nom de fichier valide à partir de l'URL.
    """
    parsed = urlparse(url)
    name = os.path.basename(parsed.path)
    # si pas d'extension, on ajoute .jpg par défaut
    if not os.path.splitext(name)[1]:
        name += '.jpg'
    return name

def download_images(urls, output_dir, base_url=None):
    """
    Télécharge chaque URL de la liste dans le dossier output_dir.
    Si l'URL est relative, la convertit grâce à base_url.
    """
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    for i, url in enumerate(urls, 1):
        full_url = urljoin(base_url, url) if base_url else url
        try:
            resp = requests.get(full_url, timeout=10)
            resp.raise_for_status()
        except Exception as e:
            print(f"[!] Échec téléchargement #{i} : {full_url} -> {e}")
            continue

        filename = sanitize_filename(full_url)
        # éviter collision
        dest = os.path.join(output_dir, filename)
        if os.path.exists(dest):
            # ajouter un suffixe
            name, ext = os.path.splitext(filename)
            dest = os.path.join(output_dir, f"{name}_{i}{ext}")

        with open(dest, 'wb') as f:
            f.write(resp.content)
        print(f"[+] Image #{i} sauvée : {dest}")

def main():
    if len(sys.argv) < 3:
        print("Usage: python download_imgs.py <fichier_html.txt> <dossier_destination> [base_url]")
        sys.exit(1)

    input_file = sys.argv[1]
    output_dir = sys.argv[2]
    base_url = sys.argv[3] if len(sys.argv) >= 4 else None

    # lecture du bloc HTML
    with open(input_file, 'r', encoding='utf-8') as f:
        html = f.read()

    # extraction
    urls = extract_image_urls(html)
    if not urls:
        print("Aucune balise <img> trouvée.")
        return

    print(f"{len(urls)} URL(s) d'image(s) trouvée(s).")
    download_images(urls, output_dir, base_url)

if __name__ == '__main__':
    main()
