import TinderCard from 'react-tinder-card'
import {useEffect, useState} from 'react'
import ChatContainer from '../components/ChatContainer'
import {useCookies} from 'react-cookie'
import axios from 'axios'

const Dashboard = () => {
    const [user, setUser] = useState(null)
    const [genderedUsers, setGenderedUsers] = useState(null)
    const [lastDirection, setLastDirection] = useState()
    const [cookies, setCookie, removeCookie] = useCookies(['user'])

    const userId = cookies.UserId


    const getUser = async () => {
        try {
            const response = await axios.get('http://localhost:8000/user', {
                params: {userId}
            })
            setUser(response.data)
        } catch (error) {
            console.log(error)
        }
    }
    
    const getGenderedUsers = async () => {
        try {
            // Only proceed if the user object (and thus gender_interest) is available
            if (user?.gender_interest) {
                 const response = await axios.get('http://localhost:8000/gendered-users', {
                    params: {gender: user.gender_interest}
                })
                setGenderedUsers(response.data)
            }
        } catch (error) {
            console.log(error)
        }
    }

    // Effect 1: Fetch current user data on component mount
    useEffect(() => {
        getUser()
    }, [])

    // Effect 2: Fetch gendered users only after current user data is loaded
    useEffect(() => {
        if (user) {
            getGenderedUsers()
        }
    }, [user])

    const updateMatches = async (matchedUserId) => {
        try {
            await axios.put('http://localhost:8000/addmatch', {
                userId,
                matchedUserId
            })
            // Refresh user data to update the matches list
            getUser() 
        } catch (err) {
            console.log(err)
        }
    }


    const swiped = (direction, swipedUserId) => {
        if (direction === 'right') {
            updateMatches(swipedUserId)
        }
        setLastDirection(direction)
    }

    const outOfFrame = (name) => {
        console.log(name + ' left the screen!')
    }
    
    // Calculate filtered list. This will be null/undefined until both user and genderedUsers are fetched.
    const matchedUserIds = user?.matches.map(({user_id}) => user_id).concat(userId)

    const filteredGenderedUsers = genderedUsers?.filter(genderedUser => !matchedUserIds.includes(genderedUser.user_id))


    console.log('filteredGenderedUsers ', filteredGenderedUsers)
    return (
        <>
            {/* THE FIX: Check that both 'user' is loaded AND 'filteredGenderedUsers' 
                is defined before attempting to render the complex swipe logic. 
                This prevents the TinderCard library from crashing due to undefined data.
            */}
            {user && filteredGenderedUsers &&
            <div className="dashboard">
                <ChatContainer user={user}/>
                
                <div className="swipe-container">
                    <div className="card-container">

                        {/* Since we checked 'filteredGenderedUsers' above, we can safely map over it here */}
                        {filteredGenderedUsers.map((genderedUser) =>
                            <TinderCard
                                className="swipe"
                                key={genderedUser.user_id}
                                onSwipe={(dir) => swiped(dir, genderedUser.user_id)}
                                onCardLeftScreen={() => outOfFrame(genderedUser.first_name)}>
                                <div
                                    style={{backgroundImage: "url(" + genderedUser.url + ")"}}
                                    className="card">
                                    <h3>{genderedUser.first_name}</h3>
                                </div>
                            </TinderCard>
                        )}
                        <div className="swipe-info">
                            {lastDirection ? <p>You swiped {lastDirection}</p> : <p/>}
                        </div>
                    </div>
                </div>
            </div>}
            
            {/* Optional: Render a loading state while waiting for data */}
            {!user && <p>Loading...</p>}
        </>
    )
}
export default Dashboard