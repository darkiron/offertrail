import React, { createContext, useContext, useMemo } from 'react';

type Locale = 'fr';

const translations = {
  fr: {
    nav: {
      dashboard: '⌂ Tableau de bord',
      applications: '◎ Candidatures',
      organizations: '▣ Etablissements',
      contacts: '◌ Contacts',
      import: '⇪ Import',
      brand: 'OfferTrail',
      themeDark: '☼ Clair',
      themeLight: '◐ Sombre',
      footer: 'OfferTrail © 2026 • interface unifiee et badges harmonises',
    },
    common: {
      close: 'Fermer',
      cancel: 'Annuler',
      retry: 'Reessayer',
      loading: 'Chargement...',
      edit: '✎ Modifier',
      details: '↗ Details',
      create: '＋ Creer',
      backToDashboard: 'Retour au tableau de bord',
      backToOrganizations: 'Retour aux etablissements',
      backToContacts: 'Retour aux contacts',
      noData: 'Aucune donnee disponible.',
    },
    dashboard: {
      kicker: 'Poste de pilotage',
      title: 'Tableau de bord',
      copy: 'Meme systeme de badges, meme hierarchie visuelle, et une vue plus nette pour piloter candidatures, relances et insights.',
      newApplication: '＋ Nouvelle candidature',
      import: '⇪ Import',
      active: 'Actif',
      responses: 'Reponses',
      followups: 'Relances',
      activeHint: 'dossiers encore en mouvement',
      responsesHint: 'candidatures ayant recu un signal',
      followupsHint: 'a traiter en priorite',
      totalApplications: 'Total candidatures',
      activePipeline: 'Pipeline actif',
      dueFollowups: 'Relances dues',
      rejectedRate: 'Taux de refus',
      responseRate: 'Taux de reponse',
      avgResponseTime: 'Temps moyen de reponse',
      ongoingProcesses: 'Processus en cours',
      attentionRequired: 'Attention requise',
      refusals: 'refus',
      responsesCount: 'reponses',
      days: 'Jours',
      tabApplications: '◎ Candidatures',
      tabFollowups: '◷ File de relance',
      tabInsights: '◌ Insights',
      search: 'Recherche',
      status: 'Statut',
      showHidden: 'Afficher refus et offres',
      company: 'Etablissement',
      position: 'Poste',
      applied: 'Postule le',
      action: 'Action',
      sourceDirect: 'Direct',
      noApplications: 'Aucune candidature ne correspond aux filtres actuels.',
      noFollowups: 'Aucune relance en attente.',
      loadingInsights: 'Chargement des insights...',
      failedInsights: 'Impossible de charger les insights.',
      markDone: '✓ Traite',
      nextFollowup: 'Prochaine relance',
      page: 'Page',
      of: 'sur',
      total: 'total',
      previous: 'Precedent',
      next: 'Suivant',
    },
    contacts: {
      kicker: 'Carte relationnelle',
      title: 'Contacts',
      copy: 'Navigation plus claire, meilleur rythme visuel, et une vraie fiche detail pour consulter, modifier et relier chaque contact.',
      newContact: '＋ Nouveau contact',
      total: 'Total',
      recruiters: 'Recruteurs',
      linked: 'Lies',
      totalHint: 'contacts suivis dans l’application',
      recruitersHint: 'interlocuteurs lies au recrutement',
      linkedHint: 'deja rattaches a un ETS',
      searchPlaceholder: 'Rechercher un nom, un role ou un email...',
      loading: 'Chargement des contacts...',
      results: 'resultat(s)',
      tabAll: 'Tous',
      tabRecruiters: 'Recruteurs',
      tabLinked: 'Lies',
      tabUnlinked: 'Non lies',
      tabAllHint: 'Base complete des contacts',
      tabRecruitersHint: 'Interlocuteurs directement lies au recrutement',
      tabLinkedHint: 'Contacts relies a un ETS',
      tabUnlinkedHint: 'Contacts sans ETS',
      noRole: 'Role non defini',
      recruiter: 'Recruteur',
      noOrg: 'Aucun ETS lie pour le moment',
      email: 'Email',
      phone: 'Telephone',
      notDefined: 'Non renseigne',
      updated: 'Mis a jour',
      openCard: '↗ Ouvrir la fiche',
      noMatches: 'Aucun contact ne correspond aux filtres actuels.',
      loadError: 'Impossible de charger les contacts.',
      detailKicker: 'Fiche contact',
      detailNoRole: 'Aucun role defini.',
      sendEmail: '✉ Envoyer un email',
      linkedin: '↗ LinkedIn',
      linkedOrg: 'ETS lie',
      noLinkedOrg: 'Aucun ETS lie',
      applicationsLinked: 'Candidatures liees',
      updatedAt: 'Mis a jour',
      overview: 'Vue d’ensemble',
      applications: 'Candidatures',
      activity: 'Activite',
      notes: 'Notes',
      noNotes: 'Aucune note pour le moment.',
      noApplications: 'Aucune candidature liee.',
      openApplication: '↗ Ouvrir la candidature',
      noActivity: 'Aucune activite recente.',
      identity: 'Identite',
      channels: 'Coordonnees',
      created: 'Cree le',
      noEmail: 'Aucun email',
      noPhone: 'Aucun telephone',
      loadingDetail: 'Chargement du contact...',
      detailError: 'Impossible de charger la fiche contact.',
      createKicker: 'Creation de contact',
      createTitle: 'Nouveau contact',
      firstName: 'Prenom',
      lastName: 'Nom',
      role: 'Role',
      organization: 'Etablissement',
      searchOrg: 'Rechercher un ETS...',
      recruiterContact: 'Contact recruteur',
      createContact: '＋ Creer le contact',
      createError: 'Impossible de creer le contact.',
      createOrg: '＋ Creer l’ETS',
    },
    application: {
      kicker: 'Dossier candidature',
      loading: 'Chargement de la candidature...',
      detailError: 'Impossible de charger la candidature.',
      created: 'Application creee',
      statusUpdated: 'Statut mis a jour',
      noteAdded: 'Note ajoutee',
      contactCreated: 'Contact cree',
      contactLinked: 'Contact lie',
      followupSent: 'Relance envoyee',
      responseReceived: 'Reponse recue',
      interviewScheduled: 'Entretien planifie',
      offerReceived: 'Offre recue',
      responseAction: '✉ Reponse recue',
      followupAction: '✓ Relance faite',
      applied: 'Postule le',
      nextFollowup: 'Prochaine relance',
      organization: 'Etablissement',
      timeline: 'Chronologie',
      noEvents: 'Aucun evenement enregistre.',
      quickNote: 'Note rapide',
      addNote: '＋ Ajouter une note',
      details: 'Details',
      type: 'Type',
      source: 'Source',
      appliedAt: 'Date de candidature',
      viewJob: '↗ Voir l’offre',
      contacts: 'Contacts',
      addContact: '＋ Ajouter',
      noContacts: 'Aucun contact lie pour le moment.',
      addContactTitle: 'Ajouter un contact',
      createNew: '＋ Creer',
      linkExisting: '↗ Lier',
      createAndLink: '＋ Creer et lier',
      noExistingContacts: 'Aucun contact existant trouve.',
      recruiter: 'Recruteur',
      contact: 'Contact',
    },
    organization: {
      linkedApplications: 'Candidatures liees',
      linkedContacts: 'Contacts lies',
      events: 'Evenements',
      signalHintGood: 'Signal favorable et documente.',
      signalHintMedium: 'Signal mitige a surveiller.',
      signalHintRisk: 'Signal de risque eleve.',
      signalHintWeak: 'Manque de donnees: a traiter comme signal faible.',
    },
    newApplication: {
      kicker: 'Creation de candidature',
      title: 'Nouvelle candidature',
      core: 'Informations principales',
      tracking: 'Suivi',
      organization: 'Etablissement ou nom de societe',
      organizationPlaceholder: 'Rechercher ou saisir un nom d’ETS...',
      createOrg: '＋ Creer l’ETS',
      jobTitle: 'Intitule du poste',
      type: 'Type',
      initialStatus: 'Statut initial',
      appliedAt: 'Date de candidature',
      nextFollowup: 'Prochaine relance',
      source: 'Source',
      sourcePlaceholder: 'LinkedIn, referral...',
      jobUrl: 'URL de l’offre',
      jobUrlPlaceholder: 'https://...',
      tip: 'Astuce : si l’ETS existe deja, le selectionner ici conserve son type et son signal de probite.',
      createAction: '＋ Creer la candidature',
      createError: 'Impossible de creer la candidature. Verifie les donnees saisies.',
    },
  },
} as const;

type TranslationTree = typeof translations.fr;

interface I18nValue {
  locale: Locale;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

const getValue = (tree: TranslationTree, key: string): string => {
  const parts = key.split('.');
  let current: unknown = tree;
  for (const part of parts) {
    if (!current || typeof current !== 'object' || !(part in current)) {
      return key;
    }
    current = (current as Record<string, unknown>)[part];
  }
  return typeof current === 'string' ? current : key;
};

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const locale: Locale = 'fr';

  const value = useMemo<I18nValue>(() => ({
    locale,
    t: (key: string) => getValue(translations[locale], key),
  }), [locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return context;
};
