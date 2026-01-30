import { useState, useEffect } from 'react';
import { Button } from '../../components/buttons/Button';
import { theme } from '../../config/theme';
import { getMyProfile, updateMyProfile, type UserProfile } from '../../services/profile';
import { useAuth } from '../../context/AuthContext';

export default function Profile() {
    const { user } = useAuth();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editedDetails, setEditedDetails] = useState('');
    const [saving, setSaving] = useState(false);

    const username = user?.username ?? null;
    const isGuest = !username || username.startsWith('guest_');

    useEffect(() => {
        async function fetchProfile() {
            if (!username || isGuest) {
                setLoading(false);
                return;
            }

            try {
                const data = await getMyProfile(username);
                setProfile(data);
                setEditedDetails(data.profile_details || '');
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load profile');
            } finally {
                setLoading(false);
            }
        }

        fetchProfile();
    }, [username, isGuest]);

    const handleSave = async () => {
        if (!username) return;

        setSaving(true);
        setError(null);

        try {
            const updated = await updateMyProfile(username, {
                profile_details: editedDetails || null,
            });
            setProfile(updated);
            setIsEditing(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save profile');
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setEditedDetails(profile?.profile_details || '');
        setIsEditing(false);
    };

    if (loading) {
        return (
            <div style={{ padding: 20 }}>
                <h2>Profile</h2>
                <p>Loading...</p>
            </div>
        );
    }

    if (isGuest) {
        return (
            <div style={{ padding: 20 }}>
                <h2>Profile</h2>
                <div style={{
                    ...theme.card,
                    maxWidth: 500,
                }}>
                    <p style={{ margin: 0, color: theme.colors.text }}>
                        Guest users cannot have profiles. Please log in or register to create a profile.
                    </p>
                </div>
            </div>
        );
    }

    if (error && !profile) {
        return (
            <div style={{ padding: 20 }}>
                <h2>Profile</h2>
                <div style={{
                    ...theme.card,
                    maxWidth: 500,
                }}>
                    <p style={{ margin: 0, color: theme.colors.danger }}>{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ padding: 20 }}>
            <h2>Profile</h2>

            <div style={{
                ...theme.card,
                maxWidth: 500,
            }}>
                {/* Username */}
                <div style={{ marginBottom: 20 }}>
                    <label style={{
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        marginBottom: 4,
                        color: theme.colors.text,
                    }}>
                        Username
                    </label>
                    <div style={{
                        padding: '8px 12px',
                        backgroundColor: theme.colors.background,
                        borderRadius: 4,
                        color: theme.colors.text,
                    }}>
                        {profile?.username}
                    </div>
                </div>

                {/* Rating */}
                <div style={{ marginBottom: 20 }}>
                    <label style={{
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        marginBottom: 4,
                        color: theme.colors.text,
                    }}>
                        Rating
                    </label>
                    <div style={{
                        padding: '8px 12px',
                        backgroundColor: theme.colors.background,
                        borderRadius: 4,
                        color: theme.colors.text,
                        fontWeight: 600,
                    }}>
                        {profile?.rating}
                    </div>
                </div>

                {/* Profile Details */}
                <div style={{ marginBottom: 20 }}>
                    <label style={{
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        marginBottom: 4,
                        color: theme.colors.text,
                    }}>
                        About Me
                    </label>
                    {isEditing ? (
                        <textarea
                            value={editedDetails}
                            onChange={(e) => setEditedDetails(e.target.value)}
                            placeholder="Tell others about yourself..."
                            style={{
                                width: '100%',
                                minHeight: 100,
                                padding: '8px 12px',
                                border: `1px solid ${theme.colors.border}`,
                                borderRadius: 4,
                                fontSize: '1rem',
                                resize: 'vertical',
                                boxSizing: 'border-box',
                            }}
                        />
                    ) : (
                        <div style={{
                            padding: '8px 12px',
                            backgroundColor: theme.colors.background,
                            borderRadius: 4,
                            color: theme.colors.text,
                            minHeight: 60,
                            whiteSpace: 'pre-wrap',
                        }}>
                            {profile?.profile_details || (
                                <span style={{ color: theme.colors.placeholder, fontStyle: 'italic' }}>
                                    No profile details yet
                                </span>
                            )}
                        </div>
                    )}
                </div>

                {/* Error message */}
                {error && (
                    <p style={{ color: theme.colors.danger, margin: '0 0 16px 0' }}>
                        {error}
                    </p>
                )}

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: 12 }}>
                    {isEditing ? (
                        <>
                            <Button onClick={handleSave} disabled={saving}>
                                {saving ? 'Saving...' : 'Save'}
                            </Button>
                            <Button onClick={handleCancel} variant="secondary" disabled={saving}>
                                Cancel
                            </Button>
                        </>
                    ) : (
                        <Button onClick={() => setIsEditing(true)}>
                            Edit Profile
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
