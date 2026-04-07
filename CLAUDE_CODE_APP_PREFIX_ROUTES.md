Lis intégralement frontend/src/App.tsx et tous les fichiers dans frontend/src/pages/ avant de toucher quoi que ce soit.

## OBJECTIF

Toutes les routes protégées (qui nécessitent d'être connecté) doivent être préfixées par /app/.
Les routes publiques (landing, login, register, forgot-password, reset-password) restent à la racine.

## RÉSULTAT ATTENDU

Routes publiques — inchangées :
  /                     → LandingPage (ou redirect vers /app si déjà connecté)
  /login                → LoginPage
  /register             → RegisterPage
  /forgot-password      → ForgotPasswordPage
  /reset-password       → ResetPasswordPage

Routes protégées — toutes préfixées /app/ :
  /app                  → Dashboard (redirect depuis /app/)
  /app/candidatures     → ApplicationsPage
  /app/candidatures/:id → ApplicationDetails
  /app/etablissements   → OrganizationsPage (ou EtablissementsPage)
  /app/etablissements/:id → CompanyDetailsPage
  /app/contacts         → ContactsPage
  /app/contacts/:id     → ContactDetailsPage
  /app/import           → Import
  /app/mon-compte       → MonCompte
  /app/pricing          → Pricing
  /app/admin            → Admin

## CE QUE TU DOIS MODIFIER

### 1. App.tsx — restructurer les routes

Utilise un layout avec Routes imbriquées pour les routes /app/* :

```tsx
<Routes>
  {/* Routes publiques */}
  <Route path="/"                element={<LandingPage />} />
  <Route path="/login"           element={<LoginPage />} />
  <Route path="/register"        element={<RegisterPage />} />
  <Route path="/forgot-password" element={<ForgotPasswordPage />} />
  <Route path="/reset-password"  element={<ResetPasswordPage />} />

  {/* Routes protégées sous /app/ */}
  <Route path="/app/*" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
    <Route index                      element={<Dashboard />} />
    <Route path="candidatures"        element={<ApplicationsPage />} />
    <Route path="candidatures/:id"    element={<ApplicationDetails />} />
    <Route path="etablissements"      element={<OrganizationsPage />} />
    <Route path="etablissements/:id"  element={<CompanyDetailsPage />} />
    <Route path="contacts"            element={<ContactsPage />} />
    <Route path="contacts/:id"        element={<ContactDetailsPage />} />
    <Route path="import"              element={<Import />} />
    <Route path="mon-compte"          element={<MonCompte />} />
    <Route path="pricing"             element={<Pricing />} />
    <Route path="admin"               element={<Admin />} />
  </Route>

  {/* Fallback */}
  <Route path="*" element={<Navigate to="/" />} />
</Routes>
```

Crée un composant AppLayout qui rend la Navbar + <Outlet /> :

```tsx
import { Outlet } from 'react-router-dom'

const AppLayout: React.FC = () => (
  <>
    <Navbar />
    <main className="flex-grow">
      <Outlet />
    </main>
    <footer className="app-footer">...</footer>
  </>
)
```

La Navbar ne s'affiche que dans /app/* — plus sur la landing, login, register.

### 2. Navbar — mettre à jour les liens

Tous les Link dans la Navbar doivent pointer vers /app/* :

```tsx
<Link to="/app">Tableau de bord</Link>
<Link to="/app/candidatures">Candidatures</Link>
<Link to="/app/etablissements">Établissements</Link>
<Link to="/app/contacts">Contacts</Link>
<Link to="/app/import">Import</Link>

// Dropdown user
<Link to="/app/mon-compte">Mon compte</Link>
<Link to="/app/pricing">Abonnement</Link>
<Link to="/app/admin">Administration</Link>  // si admin
```

isActive doit utiliser /app/* :

```tsx
const isActive = (path: string) =>
  location.pathname === path || location.pathname.startsWith(path + '/')
```

### 3. Tous les navigate() et Link dans les pages

Cherche dans frontend/src/ tous les navigate() et <Link to="..."> qui pointent vers des routes protégées.
Ajoute le préfixe /app/ :

navigate('/') → navigate('/app')
navigate('/applications') → navigate('/app/candidatures')
navigate('/organizations') → navigate('/app/etablissements')
navigate('/contacts') → navigate('/app/contacts')
navigate('/mon-compte') → navigate('/app/mon-compte')
navigate('/pricing') → navigate('/app/pricing')
navigate('/admin') → navigate('/app/admin')
navigate('/import') → navigate('/app/import')

Cherche avec : grep -r "navigate('/" frontend/src/pages/
Cherche avec : grep -r 'to="/' frontend/src/

### 4. Après login réussi

Dans AuthContext.tsx ou LoginPage.tsx, le redirect post-login :
navigate('/app') — pas navigate('/')

Dans RegisterPage.tsx, le redirect post-register :
navigate('/app') — pas navigate('/')

### 5. ProtectedRoute

Le composant ProtectedRoute doit rediriger vers /login (pas /) si non authentifié.
Ça ne change probablement pas — vérifier quand même.

### 6. LandingPage sur /

Si LandingPage n'existe pas encore comme composant React :
Crée frontend/src/pages/LandingPage.tsx qui rend le contenu de landing/index.html
OU importe simplement le HTML statique.

Si la landing est trop complexe à porter en React, une alternative simple :

```tsx
// LandingPage.tsx minimal — redirige vers /login si pas connecté
// ou affiche un message avec lien vers /register et /login
export const LandingPage: React.FC = () => {
  const { isAuthenticated } = useAuth()
  if (isAuthenticated) return <Navigate to="/app" />
  return (
    // contenu landing statique ici
    // ou redirect vers le fichier HTML statique servi séparément
  )
}
```

### 7. Vérifier vercel.json

Dans frontend/vercel.json, le rewrite SPA doit couvrir /app/* :

```json
{
  "rewrites": [
    { "source": "/app/(.*)", "destination": "/index.html" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

## TESTS À FAIRE APRÈS

Sans être connecté :
- / → landing visible, pas de redirect vers /login
- /login → page login
- /register → page register
- /app → redirect vers /login
- /app/candidatures → redirect vers /login

Après login :
- /login → redirect vers /app
- /app → dashboard
- /app/candidatures → liste candidatures
- / → landing (ou redirect /app si tu veux)

## RÈGLES

- Branche : feat/app-prefix-routes depuis dev
- Un seul commit : 'feat: prefix all protected routes with /app/'
- Ne pas modifier la logique métier des pages
- Ne pas modifier l'API ni le backend
- make test doit passer après
