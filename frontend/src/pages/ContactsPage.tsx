import React, { useEffect, useState } from 'react';
import { contactService } from '../services/api';
import {Title} from '../components/atoms/Title';
import Spinner from '../components/atoms/Spinner';
import type { Contact } from '../types';

export const ContactsPage: React.FC = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const data = await contactService.getAll();
      setContacts(data);
    } catch (err) {
      setError('Failed to load contacts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const filteredContacts = contacts.filter(c => 
    `${c.first_name} ${c.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
    (c.role && c.role.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="contacts-page p-lg">
      <div className="flex justify-between items-center mb-lg">
        <div>
          <Title>Contacts</Title>
          <p className="text-sm text-secondary">{contacts.length} contacts au total</p>
        </div>
        <button className="btn btn-primary">+ NOUVEAU CONTACT</button>
      </div>

      <div className="card p-md mb-lg">
        <input 
          className="input w-full" 
          placeholder="Rechercher un contact..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <Spinner />
      ) : error ? (
        <div className="notification is-danger">{error}</div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="table is-hoverable is-fullwidth w-full text-left">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="p-md">Nom</th>
                <th className="p-md">Rôle</th>
                <th className="p-md">Email</th>
                <th className="p-md">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredContacts.length === 0 ? (
                <tr>
                  <td colSpan={4} className="has-text-centered py-xl text-secondary italic text-center">Aucun contact trouvé.</td>
                </tr>
              ) : (
                filteredContacts.map(contact => (
                  <tr key={contact.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                    <td className="p-md">
                      <div className="flex flex-col">
                        <span className="font-bold">{contact.first_name} {contact.last_name}</span>
                        {contact.is_recruiter ? <span className="text-[10px] text-pink-500 font-mono uppercase font-bold">Recruteur</span> : null}
                      </div>
                    </td>
                    <td className="p-md text-sm">{contact.role || '-'}</td>
                    <td className="p-md text-xs font-mono text-secondary">{contact.email || '-'}</td>
                    <td className="p-md">
                      <button className="text-xs text-blue-400 hover:underline">EDIT</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
