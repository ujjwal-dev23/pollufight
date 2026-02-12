import { db } from "@/lib/firebase"
import { doc, updateDoc, increment, setDoc, getDoc } from "firebase/firestore"
import { getUserId } from "@/lib/user-id"

export async function awardCredits(amount: number, customUserId?: string): Promise<void> {
    const userId = customUserId || getUserId()
    const userRef = doc(db, "user_credits", userId)

    try {
        const docSnap = await getDoc(userRef)

        if (docSnap.exists()) {
            await updateDoc(userRef, {
                credits: increment(amount),
                updatedAt: new Date(),
            })
            console.log(`Awarded ${amount} credits to user ${userId}`)
        } else {
            // Create document if it doesn't exist
            await setDoc(userRef, {
                credits: 150 + amount, // Start with 150 + bonus
                createdAt: new Date(),
                updatedAt: new Date(),
            })
            console.log(`Created wallet for user ${userId} and awarded ${amount} credits`)
        }
    } catch (error) {
        console.error("Error awarding credits:", error)
    }
}
