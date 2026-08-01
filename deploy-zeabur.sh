#!/bin/bash
set -e
cd "$(dirname "$0")"

echo "=========================================="
echo "  Homeopathy Clinic — Zeabur Deploy"
echo "=========================================="
echo ""
echo "PEHLE (browser mein, 1 minute):"
echo "  1. https://zeabur.com/dashboard kholo"
echo "  2. 'Create Project' dabao"
echo "  3. Name: homeopathy-clinic"
echo "  4. Region: Singapore (ya koi bhi shared region)"
echo "  5. Create dabao"
echo ""
read -p "Project dashboard pe ban gaya? Enter dabao..."

echo ""
echo "Ab deploy ho raha hai... (5-10 min)"
echo "Jab pooche 'create new project?' → n (No) dabao"
echo "Apna homeopathy-clinic project select karo"
echo ""

npx zeabur@latest deploy --name homeopathy-clinic

echo ""
echo "Done! Upar jo URL dikhe use phone pe kholo."
echo "Login: 9876543210 / password123"
