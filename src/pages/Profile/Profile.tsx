import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '../../components/buttons/Button';
import { theme } from '../../config/theme';
import { getUserProfile, updateUserProfile, type UserProfile } from '../../services/profile';
import { useAuth } from '../../context/AuthContext';

export default function Profile() {
    const { username: profileUsername } = useParams<{ username: string }>();
    const { user } = useAuth();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editedDetails, setEditedDetails] = useState('');
    const [saving, setSaving] = useState(false);

    const currentUsername = user?.username ?? null;
    const isOwnProfile = currentUsername === profileUsername;
    const canEdit = isOwnProfile && currentUsername && !currentUsername.startsWith('guest_');

    useEffect(() => {
        async function fetchProfile() {
            if (!profileUsername) {
                setLoading(false);
                setError('No username specified');
                return;
            }

            try {
                const data = await getUserProfile(profileUsername);
                setProfile(data);
                setEditedDetails(data.profile_details || '');
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load profile');
            } finally {
                setLoading(false);
            }
        }

        fetchProfile();
    }, [profileUsername]);

    const handleSave = async () => {
        if (!currentUsername || !canEdit) return;

        setSaving(true);
        setError(null);

        try {
            const updated = await updateUserProfile(currentUsername, {
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
            <h2>{profile?.username}</h2>

            <div style={{
                ...theme.card,
                maxWidth: 500,
            }}>
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
                        About
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

                {/* Action buttons - only show if viewing own profile */}
                {canEdit && (
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
                )}
            </div>
        </div>
    );
}
