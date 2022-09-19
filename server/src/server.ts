import express from "express";
import cors from 'cors';

import { PrismaClient } from '@prisma/client'
import { convertHourStringToMinutes } from "./utils/convert-hour-string-to-minute";
import { convertMinutesToHourString } from "./utils/convert-minute-to-hour-string";

const app = express()
app.use(express.json())
app.use(cors({
    origin: '*'
}))

const prisma = new PrismaClient()

app.get('/games', async (request, response) => {
    const games = await prisma.game.findMany({
        include: {
            _count: {
                select: {
                    ads: true
                }
            }
        }
    })

    return response.json(games)
});

app.get('/games/:id/ads', async (request,response) => {
    const gameId = request.params.id

    const ads = await prisma.ad.findMany({
        select: {
            id: true,
            name: true,
            weekDays: true,
            yearsPlaying: true,
            hourStart: true,
            hourEnd: true,
            useVoiceChannel: true,
        },
        where: {
            gameId,
        },
        orderBy: {
            createdAt: 'desc',
        }
    })
    
    return response.status(200).json(ads.map(ad => {
        return {
            ...ad,
            weekDays: ad.weekDays.split(','),
            hourStart: convertMinutesToHourString(ad.hourStart),
            hourEnd: convertMinutesToHourString(ad.hourEnd),
        }
    }))
})

app.post('/games/:id/ads', async (request, response) => {
    const gameId = request.params.id
    const body = request.body

    const ad = await prisma.ad.create({
        data: {
            gameId,            
            name: body.name,
            weekDays: body.weekDays.join(','),
            yearsPlaying: body.yearsPlaying,
            hourStart: convertHourStringToMinutes(body.hourStart),
            hourEnd: convertHourStringToMinutes(body.hourEnd),
            useVoiceChannel: body.useVoiceChannel,
            discord: body.discord
        }
    })

    return response.status(201).json(ad)
});

app.get('/ads/:id/discord', async (request,response) => {
    const adId = request.params.id

    const ad = await prisma.ad.findUniqueOrThrow({
        select: {
            discord: true,
        },
        where: {
            id: adId
        }
    })
    
    return response.status(200).json({
        discord: ad.discord
    })
})

app.listen(3333)